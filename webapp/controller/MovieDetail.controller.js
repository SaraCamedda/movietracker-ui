sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("it.accenture.movietracker.movietrackerui.controller.MovieDetail", {

        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteMovieDetail")
                .attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            var sMovieId = oEvent.getParameter("arguments").movieId;

            this.getView().bindElement({
                path: "/Movies(" + sMovieId + ")",
                parameters: {
                    $expand: "review"
                }
            });
        },

        onNavBack: function () {
            var oRouter = this.getOwnerComponent().getRouter();

            // Refresh mirato sull'entity set Movies
            var oModel = this.getView().getModel();
            var oListBinding = oModel.bindList("/Movies");
            oListBinding.refresh();

            oRouter.navTo("RouteMovieList");
        },

        onMarkAsWatched: function () {
            var oContext = this.getView().getBindingContext();
            var oModel = this.getView().getModel();

            if (!oContext) {
                MessageToast.show("Nessun film selezionato");
                return;
            }

            oContext.setProperty("status", "WATCHED");

            oModel.submitBatch("$auto").then(function () {
                MessageToast.show("Film marcato come visto! ✅");
            }).catch(function (oError) {
                MessageToast.show("Errore: " + oError.message);
            });
        }
    });
});