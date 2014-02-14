package io.vertx.example;

import org.vertx.java.core.Handler;
import org.vertx.java.core.buffer.Buffer;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.http.HttpServerRequest;
import org.vertx.java.core.http.RouteMatcher;
import org.vertx.java.core.json.JsonObject;
import org.vertx.mods.web.WebServerBase;

/**
 * @author <a href="mailto:nscavell@redhat.com">Nick Scavelli</a>
 */
public class DefaultWebServer extends WebServerBase {

  private static final String MONGO_ADDRESS = "vertx.mongopersistor";

  @Override
  public void start() {
    super.start();
    vertx.eventBus().registerHandler("vertx.mongo.save", new Handler<Message<JsonObject>>() {
      @Override
      public void handle(final Message<JsonObject> message) {
        JsonObject mongoSave = new JsonObject();
        mongoSave.putString("action", "save");
        mongoSave.putString("collection", "albums");
        mongoSave.putObject("document", message.body());
        vertx.eventBus().send(MONGO_ADDRESS, mongoSave, new Handler<Message<JsonObject>>() {
          @Override
          public void handle(Message<JsonObject> result) {
            message.reply(result.body());
          }
        });
      }
    });
  }

  @Override
  protected RouteMatcher routeMatcher() {

    Handler<HttpServerRequest> addAlbumHandler = new Handler<HttpServerRequest>() {
      @Override
      public void handle(final HttpServerRequest request) {
        request.exceptionHandler(new Handler<Throwable>() {
          @Override
          public void handle(Throwable event) {
            request.response().setStatusCode(500);
            request.response().end(event.getMessage());
          }
        });
        request.bodyHandler(new Handler<Buffer>() {
          @Override
          public void handle(Buffer body) {
            final JsonObject json = new JsonObject(body.toString());
            String validationError = validate(json);
            if (validationError != null) {
              request.response().setStatusCode(400);
              request.response().end(validationError);
            } else {
              vertx.eventBus().send("vertx.mongo.save", json, new Handler<Message<JsonObject>>() {
                @Override
                public void handle(Message<JsonObject> message) {
                  if (message.body().getString("status").equals("ok")) {
                    json.putString("_id", message.body().getString("_id"));
                    vertx.eventBus().publish("vertx.mongo.broadcast", json);
                    request.response().end();
                  } else {
                    request.response().setStatusCode(500);
                    request.response().end("Error: " + message.body().getString("message"));
                  }
                }
              });
            }
          }
        });
      }
    };

    return new RouteMatcher()
        .get("/api/albums", new Handler<HttpServerRequest>() {
          @Override
          public void handle(final HttpServerRequest request) {
            JsonObject json = new JsonObject();
            json.putString("action", "find");
            json.putString("collection", "albums");
            json.putObject("matcher", new JsonObject());
            vertx.eventBus().send(MONGO_ADDRESS, json, new Handler<Message<JsonObject>>() {
              @Override
              public void handle(Message<JsonObject> message) {
                if (message.body().getString("status").equals("ok")) {
                  request.response().end(message.body().getArray("results").encodePrettily() + "\n");
                } else {
                  request.response().setStatusCode(500);
                  request.response().end("Error: " + message.body().getString("message"));
                }
              }
            });
          }
        })
        .get("/api/albums/:id", new Handler<HttpServerRequest>() {
          @Override
          public void handle(final HttpServerRequest request) {
            JsonObject json = new JsonObject();
            json.putString("action", "find");
            json.putString("collection", "albums");
            json.putObject("matcher", new JsonObject().putString("_id", request.params().get("id")));
            vertx.eventBus().send(MONGO_ADDRESS, json, new Handler<Message<JsonObject>>() {
              @Override
              public void handle(Message<JsonObject> message) {
                if (message.body().getString("status").equals("ok")) {
                  request.response().end(message.body().getArray("results").encodePrettily() + "\n");
                } else {
                  request.response().setStatusCode(500);
                  request.response().end("Error: " + message.body().getString("message"));
                }
              }
            });
          }
        })
        .post("/api/albums", addAlbumHandler)
        .post("/api/albums/", addAlbumHandler)
        .noMatch(staticHandler());
  }

  private static String validate(JsonObject json) {
    if (json.getString("artist") == null) {
      return "artist is required";
    } else if (json.getString("title") == null) {
      return "title is required";
    } else if (json.getString("genre") == null) {
      return "genre is required";
    } else if (json.getInteger("price") == null) {
      return "price is required";
    } else {
      return null;
    }
  }
}
