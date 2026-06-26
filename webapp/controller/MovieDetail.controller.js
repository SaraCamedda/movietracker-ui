sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment"
], function (Controller, MessageToast, Fragment) {
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

              onMarkAsWatched: function (oEvent) {
            const oButton = oEvent.getSource();
            const oContext = oButton.getBindingContext();

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
            const oReview = oMovieData.review;

            try {
                if (oReview && oReview.ID) {
                    /**
                     * CASO 1:
                     * Il film ha già una review.
                     * Quindi aggiorno la review esistente.
                     */

                    const sReviewPath = "/Reviews(ID=" + oReview.ID + ")";
                    const oReviewBinding = oModel.bindContext(sReviewPath);

                    await oReviewBinding.requestObject();

                    const oReviewContext = oReviewBinding.getBoundContext();

                    oReviewContext.setProperty("rating", iRating);
                    oReviewContext.setProperty("comment", sComment);
                    oReviewContext.setProperty("watchedOn", sWatchedOn);

                    await oModel.submitBatch(oModel.getUpdateGroupId());

                    MessageToast.show("Recensione modificata!");
                } else {
                    /**
                     * CASO 2:
                     * Il film non ha ancora una review.
                     * Creo la review e collego la review al film.
                     */

                    const oReviewListBinding = oModel.bindList("/Reviews");

                    const oNewReview = oReviewListBinding.create({
                        rating: iRating,
                        comment: sComment,
                        watchedOn: sWatchedOn,
                        movie_ID: oMovieData.ID
                    });

                    await oNewReview.created();

                    const sReviewID = oNewReview.getProperty("ID");

                    oContext.setProperty("status", "WATCHED");
                    oContext.setProperty("review_ID", sReviewID);

                    await oModel.submitBatch(oModel.getUpdateGroupId());

                    MessageToast.show("Recensione salvata!");
                }

                this._oReviewDialog.close();

                oModel.refresh(true);

                this.getView().bindElement({
                    path: oContext.getPath(),
                    parameters: {
                        $expand: "review"
                    }
                });

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