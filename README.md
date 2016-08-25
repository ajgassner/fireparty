FireParty [![MIT License][license-image]][license-url]
=========

![FireParty](/doc/screen.png?raw=true "FireParty")

Features
--------

* Simple Drag'n'Drop GUI to organize people for locations
* Schedule export in Excel and PDF
* Excel export for single locations
* Checks automatically for overlaps and displays them to the user
* Save and restore work in progress

Build
-----

* `mvn clean package`
* `java -jar target/fireparty-*-jar-with-dependencies.jar`

Technologies
------------

* Programming language: Java 8
* UI framework: JavaFX
* Code generation: Project Lombok
* Dependency injection: Google Guice
* Logging: SLF4J with Logback
* PDF table export: Boxable
* Helper utility: Apache Commons
* Excel export: ApAche POI
* Font icons: Ikonli
* Unit tests: JUnit

Licencing
---------

FireParty is licenced under the [MIT License (MIT)](LICENSE).

[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE