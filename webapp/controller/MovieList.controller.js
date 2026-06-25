sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, Filter, FilterOperator, Fragment, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("it.accenture.movietracker.movietrackerui.controller.MovieList", {

        onInit: function () {
            this._currentMovieContext = null;
        },

        /**
         * Search multi-campo case-insensitive
         */
        onSearch: function (oEvent) {
            const sQuery = oEvent.getParameter("newValue") || "";
            const oTable = this.byId("moviesTable");
            const oBinding = oTable.getBinding("items");

            if (sQuery) {
                const aFieldFilters = ["title", "director", "genre"].map(field =>
                    new Filter({
                        path: field,
                        operator: FilterOperator.Contains,
                        value1: sQuery,
                        caseSensitive: false
                    })
                );
                oBinding.filter([new Filter({ filters: aFieldFilters, and: false })]);
            } else {
                oBinding.filter([]);
            }
        },

        /**
         * Click su bottone "Visto!" o "Modifica"
         */
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
                }).then(oDialog => {
                    this._oReviewDialog = oDialog;
                    oView.addDependent(oDialog);
                    this._openReviewDialog();
                });
            } else {
                this._openReviewDialog();
            }
        },

        /**
         * Popola il dialog con i dati del film selezionato
         */
        _openReviewDialog: function () {
            const oContext = this._currentMovieContext;
            const oMovieData = oContext.getObject();

            // Popola il titolo
            this.byId("dialogMovieTitle").setText(oMovieData.title);

            // Se ha già una review, mostro i valori esistenti
            const oReview = oMovieData.review;
            if (oReview && oReview.ID) {
                this.byId("dialogRating").setValue(oReview.rating || 0);
                this.byId("dialogComment").setValue(oReview.comment || "");
                this.byId("dialogWatchedOn").setValue(oReview.watchedOn || "");
            } else {
                // Reset campi
                this.byId("dialogRating").setValue(0);
                this.byId("dialogComment").setValue("");
                this.byId("dialogWatchedOn").setValue(
                    new Date().toISOString().split("T")[0]
                );
            }

            this._oReviewDialog.open();
        },

        /**
         * Salvataggio recensione
         */
        /**
  * Salvataggio recensione - versione corretta OData V4
  */
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

                // ⭐ Aspetta che la review sia stata effettivamente creata sul server
                await oNewReview.created();
                const sReviewID = oNewReview.getProperty("ID");

                // 2. UPDATE Movie (status + link a review)
                oContext.setProperty("status", "WATCHED");
                oContext.setProperty("review_ID", sReviewID);

                // ⭐ Submit del batch (forza il PATCH al server)
                await oModel.submitBatch(oModel.getUpdateGroupId());

                MessageToast.show("Recensione salvata! 🎬");
                this._oReviewDialog.close();

                // 3. Refresh OK (ora i pending changes sono stati flushati)
                this.byId("moviesTable").getBinding("items").refresh();

            } catch (oError) {
                MessageBox.error("Errore nel salvataggio: " + oError.message);
                // In caso di errore, resetto i pending changes
                oModel.resetChanges();
            }
        },

        onCancelReview: function () {
            this._oReviewDialog.close();
        },

        onMoviePress: function (oEvent) {
            var oItem = oEvent.getSource();
            var oContext = oItem.getBindingContext();
            var sMovieId = oContext.getProperty("ID");

            this.getOwnerComponent().getRouter().navTo("RouteMovieDetail", {
                movieId: sMovieId
            });
        }

    });
});