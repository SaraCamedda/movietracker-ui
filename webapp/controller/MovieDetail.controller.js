sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox"
], function (Controller, MessageToast, Fragment, MessageBox) {
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

        /*onMarkAsWatched: function () {
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
        }*/

        onMarkAsWatched: function () {
            const oContext = this.getView().getBindingContext();

            if (!oContext) {
                MessageToast.show("Nessun film selezionato");
                return;
            }

            this._currentMovieContext = oContext;

            const oView = this.getView();

            if (!this._oReviewDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "it.accenture.movietracker.movietrackerui.view.ReviewDialog",
                    controller: this
                }).then((oDialog) => {
                    this._oReviewDialog = oDialog;
                    oView.addDependent(oDialog);
                    this._openReviewDialog();
                });
            } else {
                this._openReviewDialog();
            }
        },


        _openReviewDialog: function () {
            const oContext = this._currentMovieContext;
            const oMovieData = oContext.getObject();

            this.byId("dialogMovieTitle").setText(oMovieData.title);

            const oReview = oMovieData.review;

            if (oReview && oReview.ID) {
                this.byId("dialogRating").setValue(oReview.rating || 0);
                this.byId("dialogComment").setValue(oReview.comment || "");
                this.byId("dialogWatchedOn").setValue(oReview.watchedOn || "");
            } else {
                this.byId("dialogRating").setValue(0);
                this.byId("dialogComment").setValue("");
                this.byId("dialogWatchedOn").setValue(
                    new Date().toISOString().split("T")[0]
                );
            }

            this._oReviewDialog.open();
        },


        onSaveReview: async function () {
            const oContext = this._currentMovieContext;
            const oMovieData = oContext.getObject();

            const iRating = this.byId("dialogRating").getValue();
            const sComment = this.byId("dialogComment").getValue();
            const sWatchedOn = this.byId("dialogWatchedOn").getValue();

            if (iRating === 0) {
                MessageToast.show("Inserisci almeno un voto!");
                return;
            }

            const oModel = this.getView().getModel();

            try {
                // 1. CREATE Review
                const oReviewListBinding = oModel.bindList("/Reviews");

                const oNewReview = oReviewListBinding.create({
                    rating: iRating,
                    comment: sComment,
                    watchedOn: sWatchedOn,
                    movie_ID: oMovieData.ID
                });

                // Aspetta che la review sia stata creata sul server
                await oNewReview.created();

                const sReviewID = oNewReview.getProperty("ID");

                // 2. UPDATE Movie
                oContext.setProperty("status", "WATCHED");
                oContext.setProperty("review_ID", sReviewID);

                // Forza il PATCH al server
                await oModel.submitBatch(oModel.getUpdateGroupId());

                MessageToast.show("Recensione salvata! 🎬");
                this._oReviewDialog.close();

                // 3. Refresh della DETAIL, non della tabella
                const oElementBinding = this.getView().getElementBinding();

                if (oElementBinding) {
                    oElementBinding.refresh();
                }

            } catch (oError) {
                MessageBox.error("Errore nel salvataggio: " + oError.message);
                oModel.resetChanges();
            }
        },

        onCancelReview: function () {
            this._oReviewDialog.close();
        }

    });
});