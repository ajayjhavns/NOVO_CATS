sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/BusyIndicator",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"com/nn/cats/SkillTypeAdmin/model/ZCATS_GW_SRV/SkillSet",
	"com/nn/cats/SkillTypeAdmin/util/Formatter",
	"com/nn/cats/SkillTypeAdmin/util/Utils"
], function (Controller, BusyIndicator, JSONModel, MessageToast, SkillSet, Formatter, Utils) {
	"use strict";

	return Controller.extend("com.nn.cats.SkillTypeAdmin.controller.Main", {
		formatter: Formatter,
		i18n: null,

		onInit: function (oEvent) {

			this.i18n = this.getOwnerComponent().getModel('i18n').getResourceBundle();

			BusyIndicator.show(0);
			this.initializeViewModelData();
			this.getOwnerComponent().getModel().setUseBatch(false);

			// Load the team employees
			this.loadSkills();
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

		// Load Skills
		loadSkills: function () {
			var that = this;
			SkillSet.getSkills(this.getOwnerComponent().getModel())
				.then(function (oData) {
					var aSkills = [];
					var aSkillsGroups = [];
					for (var i = 0; i < oData.results.length; i++) {
						if (oData.results[i].Otype === "Q") {
							aSkills.push(oData.results[i]);
						}
						if (oData.results[i].Otype === "QK") {
							aSkillsGroups.push(oData.results[i]);
						}
					}
					that.getView().setModel(new JSONModel((aSkills.length > 0) ? aSkills : []), 'Skills');
					that.getView().setModel(new JSONModel((aSkillsGroups.length > 0) ? aSkillsGroups : []), 'SkillsGroups');
					that.getView().getModel("Skills").setSizeLimit(1500);
					that.getView().getModel("SkillsGroups").setSizeLimit(1500);
					BusyIndicator.hide();
				})
				.catch(function (error) {
					Utils.displayErrorPopup(that.i18n.getText("mainView.problemLoading"), error);
					BusyIndicator.hide();
				});
		},

		// A line from the LIST was selected
		onSelectedItem: function (oEvent) {
			var sPath = oEvent.getParameter("listItem").getBindingContext("Skills").getPath();
			var obj = this.getView().getModel('Skills').getProperty(sPath);
			this.getView().getModel('viewModel').setProperty("/selectedObj", obj);
		},

		onNavHome: function (oEvent) {
			var appname = "https://time-";
			var subacc = this.getOwnerComponent().getsubAccount();
			var rest = window.location.host.split(subacc)[1];
			window.open(appname + subacc + rest, "_self");
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
						new sap.ui.model.Filter('Stext', sap.ui.model.FilterOperator.Contains, sQuery),
						new sap.ui.model.Filter('Objid', sap.ui.model.FilterOperator.Contains, sQuery)
					],
					and: false
				});

			}
			var oList = this.byId('list');
			oList.getBinding('items').filter(oFilter);
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
					placeholder: 'Skill description',
					id: 'input-skill-text',
					value: this.getView().getModel('viewModel').getProperty("/selectedObj").Stext
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						var oSelectedObj = that.getView().getModel('viewModel').getProperty("/selectedObj");
						var sNewSkillText = sap.ui.getCore().byId('input-skill-text').getValue();
						that.updateTheSkill(oSelectedObj, sNewSkillText);
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

			// First, confirm that we have selected at least one item
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
						that.deleteTheSkill(oSelectedObj);
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
						placeholder: 'Skill description',
						id: 'input-skill-text',
						value: ''
					}),
					// new sap.m.Label({
					// 	text: 'Skill Group',
					// 	labelFor: 'input-skill-group'
					// }),
					new sap.m.Select({
						id: 'input-skill-group',
						autoAdjustWidth: true,
						items: that.getSkillGroupsItems()
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
							var sSkillText = sap.ui.getCore().byId('input-skill-text').getValue();
							var sSkillGroupID = sap.ui.getCore().byId('input-skill-group').getSelectedKey();

							if (sSkillText === '') {
								MessageToast.show(that.i18n.getText("mainView.popupWarningMessage"));
								return;
							}
							if (sSkillGroupID === '') {
								MessageToast.show(that.i18n.getText("mainView.popupWarningMessage"));
								return;
							}
							that.createTheSkill(sSkillText, sSkillGroupID);

							// reset <input> field
							sap.ui.getCore().byId('input-skill-text').setValue('');
							fixedSizeDialog.close();
						}
					}),
					new sap.m.Button({
						text: 'Cancel',
						press: function () {
							// reset <input> field
							sap.ui.getCore().byId('input-skill-text').setValue('');
							fixedSizeDialog.close();
						}
					})
				]
			});

			fixedSizeDialog.open();
		},

		// Use the pre-loaded skill groups and return an array of Item(s), to feed and build the drop-down
		getSkillGroupsItems: function () {
			var oModel = this.getView().getModel('SkillsGroups');
			var arr = [];

			for (var i = 0; i < oModel.getData().length; i++) {
				var obj = oModel.getData()[i];
				var oItem = new sap.ui.core.Item({
					key: obj.PupObjid,
					text: obj.Stext
				});

				arr.push(oItem);
			}

			return arr;
		},

		updateTheSkill: function (oSelectedObj, sNewSkillText) {
			BusyIndicator.show(0);
			var that = this;

			SkillSet.updateSkill(this.getOwnerComponent().getModel(), oSelectedObj, sNewSkillText)
				.then(function (oData) {
					BusyIndicator.hide();
					that.loadSkills();
					MessageToast.show('Skill ' + oSelectedObj.Objid + ' was updated');
				})
				.catch(function (error) {
					Utils.displayErrorPopup(that.i18n.getText("mainView.problemUpdatingSkill"), error);
					BusyIndicator.hide();
				});
		},

		deleteTheSkill: function (oSelectedObj) {
			BusyIndicator.show(0);
			var that = this;

			SkillSet.deleteSkill(this.getOwnerComponent().getModel(), oSelectedObj)
				.then(function (oData) {
					BusyIndicator.hide();
					that.loadSkills();
					MessageToast.show('Skill ' + oSelectedObj.Stext + ' was deleted');
				})
				.catch(function (error) {
					Utils.displayErrorPopup(that.i18n.getText("mainView.problemDeletingSkill"), error);
					BusyIndicator.hide();
				});
		},

		createTheSkill: function (sSkillText, sSkillGroupID) {

			BusyIndicator.show(0);
			var that = this;

			SkillSet.createSkill(this.getOwnerComponent().getModel(), sSkillText, sSkillGroupID)
				.then(function (oData) {
					BusyIndicator.hide();
					that.loadSkills();
					MessageToast.show(that.i18n.getText("mainView.success"), {
						duration: 1000
					});
				})
				.catch(function (error) {
					Utils.displayErrorPopup(that.i18n.getText("mainView.problemCreatingSkill"), error);
					BusyIndicator.hide();
				});
		}

	});

});