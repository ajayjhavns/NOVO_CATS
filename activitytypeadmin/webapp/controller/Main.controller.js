sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/BusyIndicator",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"com/nn/cats/ActivityTypeAdmin/model/ZCATS_GW_SRV/ActivitySet",
	"com/nn/cats/ActivityTypeAdmin/util/Formatter",
	"com/nn/cats/ActivityTypeAdmin/util/Utils"
], function (Controller, BusyIndicator, JSONModel, MessageToast, ActivitySet, Formatter, Utils) {
	"use strict";

	return Controller.extend("com.nn.cats.ActivityTypeAdmin.controller.Main", {
		formatter: Formatter,
		i18n: null,

		onInit: function (oEvent) {

			this.i18n = this.getOwnerComponent().getModel('i18n').getResourceBundle();
			this.getOwnerComponent().getModel().setUseBatch(false);

			BusyIndicator.show(0);
			this.initializeViewModelData();

			// Load the team employees
			this.loadActivities();
		},

		// This function initializes the viewModel
		initializeViewModelData: function () {
			var oData = {
				selectedObj: null,
			};

			var oModel = new JSONModel(oData);
			oModel.setDefaultBindingMode('TwoWay');
			this.getView().setModel(oModel, 'viewModel');
		},

		// Load Activities
		loadActivities: function () {
			var that = this;

			ActivitySet.getActivityTypes(this.getOwnerComponent().getModel())
				.then(function (oData) {
					that.getView().setModel(new JSONModel((oData) ? oData.results : []), 'Activities');
					BusyIndicator.hide();
				})
				.catch(function (error) {
					Utils.displayErrorPopup(that.i18n.getText("mainView.problemLoading") + "\n" + error.toString());
					BusyIndicator.hide();
				});
		},

		// A line from the LIST was selected
		onSelectedItem: function (oEvent) {
			var sPath = oEvent.getParameter("listItem").getBindingContext("Activities").getPath();
			var obj = this.getView().getModel('Activities').getProperty(sPath);
			this.getView().getModel('viewModel').setProperty("/selectedObj", obj);
		},

		// This is called when I click on search, and also if I trigger a search on the <input>
		onSearch: function (oEvent) {
			var oFilter;
			var sQuery = oEvent.getParameter('query'); // associated event to the Search click

			if (!sQuery) {
				sQuery = oEvent.getParameter('newValue'); // associated event to the <input> change
			}

			if (sQuery && sQuery.length > 0) {
				oFilter = new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter('Acttype', sap.ui.model.FilterOperator.Contains, sQuery),
						new sap.ui.model.Filter('Name', sap.ui.model.FilterOperator.Contains, sQuery)
					],
					and: false
				});

			}
			var oList = this.byId('list');
			oList.getBinding('items').filter(oFilter);
		},

		// Button clicked: UPDATE
		onSwitch: function (oEvent) {
			var sPath = oEvent.getSource().getParent().getBindingContext("Activities").getPath();
			var oSelectedObj = this.getView().getModel('Activities').getProperty(sPath);
			this.updateTheActivity(oSelectedObj, null);
		},

		// Button clicked: UPDATE
		onUpdate: function () {
			var that = this;

			// First, confirm that we have selected at least one item
			if (this.getView().getModel('viewModel').getProperty("/selectedObj") === null) {
				MessageToast.show(that.i18n.getText("mainView.popupDeleteWarning"));
				return;
			}

			var dialog = new sap.m.Dialog({
				title: 'Confirm Update',
				type: 'Message',
				content: new sap.m.Input({
					placeholder: 'Activity description',
					id: 'input-act-text',
					value: this.getView().getModel('viewModel').getProperty("/selectedObj").Descript
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						var oSelectedObj = that.getView().getModel('viewModel').getProperty("/selectedObj");
						var sNewText = sap.ui.getCore().byId('input-act-text').getValue();
						that.updateTheActivity(oSelectedObj, sNewText);
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: 'No',
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});

			dialog.open();
		},

		// Button clicked: DELETE
		onDelete: function () {
			var that = this;

			// Firs, confirm that we have selected at least one item
			if (this.getView().getModel('viewModel').getProperty("/selectedObj") === null) {
				MessageToast.show(that.i18n.getText("mainView.popupDeleteWarning"));
				return;
			}

			var dialog = new sap.m.Dialog({
				title: 'Confirm Delete',
				type: 'Message',
				content: new sap.m.Text({
					text: that.i18n.getText("mainView.popupDeleteTitle")
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						var oSelectedObj = that.getView().getModel('viewModel').getProperty("/selectedObj");
						that.deleteTheActivity(oSelectedObj);
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: 'No',
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});

			dialog.open();
		},

		// Button clicked: CREATE
		// This function will show a popup and then create the ticket
		onCreate: function () {
			// Show popup
			var that = this;

			var fixedSizeDialog = new sap.m.Dialog({
				icon: sap.ui.core.IconPool.getIconURI('message-information'),
				title: that.i18n.getText("mainView.popupTitle"),
				content: [
					new sap.m.Input({
						placeholder: 'Activity ID',
						id: 'input-act-id',
						maxLength: 6,
						value: ''
					}),
					new sap.m.Input({
						placeholder: 'Activity description',
						id: 'input-act-text',
						value: ''
					})
				],
				type: sap.m.DialogType.Message,
				afterClose: function () {
					fixedSizeDialog.destroy();
				},
				buttons: [
					new sap.m.Button({
						text: 'OK',
						type: sap.m.ButtonType.Emphasized,
						press: function (evt) {
							var sText = sap.ui.getCore().byId('input-act-text').getValue();
							var sActivityID = sap.ui.getCore().byId('input-act-id').getValue();

							if (sText === '' || sActivityID === '') {
								MessageToast.show(that.i18n.getText("mainView.popupWarningMessage"));
								return;
							}

							that.createTheActivity(sActivityID, sText);

							// reset <input> field
							sap.ui.getCore().byId('input-act-id').setValue('');
							sap.ui.getCore().byId('input-act-text').setValue('');
							fixedSizeDialog.close();
						}
					}),
					new sap.m.Button({
						text: 'Cancel',
						press: function () {
							// reset <input> field
							sap.ui.getCore().byId('input-act-id').setValue('');
							sap.ui.getCore().byId('input-act-text').setValue('');
							fixedSizeDialog.close();
						}
					})
				]
			});

			fixedSizeDialog.open();
		},

		updateTheActivity: function (oSelectedObj, sNewText) {
			BusyIndicator.show(0);
			var that = this;

			ActivitySet.updateActivityType(this.getOwnerComponent().getModel(), oSelectedObj, sNewText)
				.then(function (oData) {
					BusyIndicator.hide();
					MessageToast.show('Activity ' + oSelectedObj.Acttype + ' was updated');
					that.loadActivities();
				})
				.catch(function (error) {
					Utils.displayErrorPopup(that.i18n.getText("mainView.problemUpdatingActivity"), error);
					BusyIndicator.hide();
				});
		},

		deleteTheActivity: function (oSelectedObj) {
			BusyIndicator.show(0);
			var that = this;

			ActivitySet.deleteActivityType(this.getOwnerComponent().getModel(), oSelectedObj)
				.then(function (oData) {
					BusyIndicator.hide();
					MessageToast.show('Activity ' + oSelectedObj.Acttype + ' was deleted');
					that.loadActivities();
				})
				.catch(function (error) {
					Utils.displayErrorPopup(that.i18n.getText("mainView.problemDeletingActivity"), error);
					BusyIndicator.hide();
				});
		},

		createTheActivity: function (sActivityID, sText) {

			BusyIndicator.show(0);
			var that = this;

			ActivitySet.createActivityType(this.getOwnerComponent().getModel(), sActivityID, sText)
				.then(function (oData) {
					BusyIndicator.hide();
					// that.getView().setModel(new JSONModel((oData) ? oData.results : []), 'Activities');
					MessageToast.show(that.i18n.getText("mainView.success"), {
						duration: 1000
					});
					that.loadActivities(); // TODO this should be replaced with returned object. roundtrips to server are not good
				})
				.catch(function (error) {
					Utils.displayErrorPopup(that.i18n.getText("mainView.problemCreatingActivity"), error);
					BusyIndicator.hide();
				});
		}

	});

});