/*global QUnit*/

sap.ui.define([
	"it/accenture/movietracker/movietrackerui/controller/MovieList.controller"
], function (Controller) {
	"use strict";

	QUnit.module("MovieList Controller");

	QUnit.test("I should test the MovieList controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
