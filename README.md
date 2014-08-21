vertx-quickstart
====================

This is a sample application for the [Vertx cartridge](https://www.openshift.com/developers/vertx) on [OpenShift](http://www.openshift.com).

The application implements a basic music store.  It is written in javascript and demonstrates sockjs and event bus, along with connecting to a mongodb backend.

To deploy it, run

    rhc app create <your_app_name> vertx mongodb --from-code=https://github.com/openshift-quickstart/vertx-quickstart
