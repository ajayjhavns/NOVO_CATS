sap.ui.define([
	"sap/m/MessageToast",
	"sap/m/Dialog",
	"sap/m/List",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/BusyIndicator",
	"com/nn/cats/manager/model/ZCATS_GW_SRV/getOrgUnitStructure",
	"com/nn/cats/manager/model/ZCATS_GW_SRV/SkillSet",
	"com/nn/cats/manager/model/ZCATS_GW_SRV/SubOrdinatesSet_expand_ToSkill",
	"com/nn/cats/manager/model/ZCATS_GW_SRV/SubOrdinatesSet",
	"com/nn/cats/manager/util/Utils",
	"com/nn/cats/manager/util/Formatter"
], function (MessageToast, Dialog, List, JSONModel, Controller, BusyIndicator, getOrgUnitStructure, SkillSet,
	SubOrdinatesSet_expand_ToSkill, SubOrdinatesSet, Utils, Formatter) {
	"use strict";

	return Controller.extend("com.nn.cats.manager.controller.Main", {

		formatter: Formatter,
		iCounter: 3, // counts the number of oData calls

		onInit: function (oEvent) {

			BusyIndicator.show(0);
			this.initializeViewModelData();
			this.getOwnerComponent().getModel().setUseBatch(false);
			this.getOwnerComponent().getModel().setSizeLimit(2500);

			// Load the team employees
			this.loadOrgUnits();
			this.loadTeamData();
			this.loadSkills();
		},

		// This function initializes the viewModel
		initializeViewModelData: function () {
			var oData = {
				currentOrgUnitText: "",
				orgFilterButtonType: "Emphasized",
				employeesVisible: ""
			};

			var oModel = new JSONModel(oData);
			oModel.setDefaultBindingMode('TwoWay');
			this.getView().setModel(oModel, 'viewModel');
		},

		// Load Orgunits
		loadOrgUnits: function () {
			var that = this;

			getOrgUnitStructure.getData(this.getOwnerComponent().getModel(), null)
				.then(function (oData) {
					that._orgData = oData.results;
					var oRoot = that._createTreeNodeFromOrgObject(oData.results[0]);
					that._treeIfyOrgStructure(oRoot);

					var arr = [];
					arr.push(oRoot);
					that.getView().setModel(new JSONModel(arr), 'OrgUnits');

					// Do we have items? First item is base
					if (oData.results && oData.results.length > 0) {
						that.getView().getModel("viewModel").setProperty("/currentOrgUnitText", oData.results[0].Name);
					}

					// Hide BusyIndicator ?
					that.iCounter--;
					if (that.iCounter === 0) {
						BusyIndicator.hide();
					}
				})
				.catch(function (error) {
					Utils.displayErrorPopup("Problem loading Org. Units", error);
				});
		},

		// Load employees
		loadTeamData: function (orgUnit) {
			var that = this;

			SubOrdinatesSet_expand_ToSkill.getEmployees(this.getOwnerComponent().getModel(), orgUnit)
				.then(function (oData) {
					that.getView().setModel(new JSONModel((oData) ? oData.results : []), 'Team');
					that.getView().getModel("Team").setSizeLimit(oData.results.length);

					that.setSelectedOrgUnitText(orgUnit);
					that.getView().getModel("viewModel").setProperty("/employeesVisible", oData.results.length);

					//Set the orgunit filter button
					that.getView().getModel("viewModel").setProperty("/orgFilterButtonType", (orgUnit) ? "Accept" : "Emphasized");

					// Hide BusyIndicator ?
					that.iCounter--;
					if (that.iCounter === 0) {
						BusyIndicator.hide();
					}
				})
				.catch(function (error) {
					Utils.displayErrorPopup("Problem loading Employees", error);
					BusyIndicator.hide();
				});
		},

		// Load Skills
		loadSkills: function () {
			var that = this;

			SkillSet.getSkills(this.getOwnerComponent().getModel())
				.then(function (oData) {
					that.getView().setModel(new JSONModel((oData) ? oData.results : []), 'Skills');

					// Hide BusyIndicator ?
					that.iCounter--;
					if (that.iCounter === 0) {
						BusyIndicator.hide();
					}
				})
				.catch(function (error) {
					Utils.displayErrorPopup("Problem loading Employees", error);
					BusyIndicator.hide();
				});
		},

		onNavHome: function (oEvent) {
			var appname = "https://time-";
			var subacc = this.getOwnerComponent().getsubAccount();
			var rest = window.location.host.split(subacc)[1];
			window.open(appname + subacc + rest, "_self");
		},

		// Update Skill of Employee
		updateEmployeeSkill: function (sObjid, sEmployeeID, sSkillID) {
			var that = this;

			SubOrdinatesSet.updateSkill(this.getOwnerComponent().getModel(), sObjid, sEmployeeID, sSkillID)
				.then(function (oData) {
					BusyIndicator.hide();
					that.loadTeamData();
				})
				.catch(function (error) {
					Utils.displayErrorPopup("Problem updating skill", error);
					BusyIndicator.hide();
				});
		},

		_treeIfyOrgStructure: function (oRoot) {
			for (var i = 0; i < this._orgData.length; i++) {
				if (oRoot.id === this._orgData[i].ObjidRef) {
					//Child found
					var oNewRoot = this._createTreeNodeFromOrgObject(this._orgData[i]);
					oRoot.nodes.push(oNewRoot);
					this._treeIfyOrgStructure(oNewRoot);
				}
			}
			return oRoot;
		},

		_createTreeNodeFromOrgObject: function (oOrg) {
			return {
				id: oOrg.Objid,
				text: oOrg.Name,
				nodes: []
			};
		},

		setSelectedOrgUnitText: function (orgUnit) {
			if (!orgUnit && this._orgData) {
				this.getView().getModel("viewModel").setProperty("/currentOrgUnitText", this._orgData[0].Name);
				return;
			}

			for (var i = 0; i < this._orgData.length; i++) {
				if (orgUnit === this._orgData[i].Objid) {
					this.getView().getModel("viewModel").setProperty("/currentOrgUnitText", this._orgData[i].Name);
					break;
				}
			}
		},

		// This is called when I click on search, and also if I trigger a search on the <input>
		onTextBasedSearch: function (oEvent) {
			this.filterEmployees(oEvent);
		},

		filterEmployees: function (oEvent) {
			var sText;
			var oBinding = this.byId("empCardList").getBinding("cards");
			var bShowMissing = this.byId("toggleShowMissing").getPressed();
			var oFilter;

			if (oEvent) {
				sText = oEvent.getParameter('query'); // associated event to the Search click

				if (!sText) {
					sText = oEvent.getParameter('newValue'); // associated event to the <input> change
				} else {
					return;
				}

				if (sText && sText.length < 1 && sText.length > 0) {
					return;
				}
			} else {
				this.byId("txtSearch").getValue();
			}

			// Textbased filter
			if (sText) {
				oFilter = new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, sText),
						new sap.ui.model.Filter("Usrid", sap.ui.model.FilterOperator.Contains, sText)
					],
					and: false
				});
			}

			// Show only "missing skills"
			if (bShowMissing) {
				oFilter = new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("SkillId", sap.ui.model.FilterOperator.EQ, "00000000")
					],
					and: false
				});
			}

			oBinding.filter(oFilter);

			// Update employee counter for the header
			this.getView().getModel("viewModel").setProperty("/employeesVisible", oBinding.iLength);
		},

		// Show popup
		onChangeOrgUnit: function (oEvent) {
			if (!this._orgPop) {
				this._orgPop = sap.ui.xmlfragment("com.nn.cats.manager.view.fragments.OrgUnitSelector", this);
				this.getView().addDependent(this._orgPop);
			}
			this._orgPop.openBy(oEvent.getSource());
		},

		onExit: function () {
			if (this._orgPop) {
				this._orgPop.destroy();
			}
		},

		onShowOnlyMissing: function () {
			this.filterEmployees();
		},

		onCardBtnEditClicked: function (oEvent) {
			this.oClickedCard = oEvent.getSource();
			var that = this;

			this.oPressDialog = new Dialog({
				title: 'Choose a new Skill',
				content: new List({
					growing: true,
					growingScrollToLoad: true,
					growingThreshold: 100,
					items: {
						path: 'Skills>/',
						template: new sap.m.StandardListItem({
							title: "{Skills>Stext}",
							// description: "{Skills>Stext}",
							press: function (oPressEvent) {
								var sPath = oPressEvent.getSource().getBindingContext("Skills").getPath();
								var oSelectedSkill = that.getView().getModel('Skills').getProperty(sPath);
								var sObjid = that.oClickedCard.getObjId();
								var sEmployeeID = that.oClickedCard.getUserId();
								var sSkillID = oSelectedSkill.Objid;
								that.updateEmployeeSkill(sObjid, sEmployeeID, sSkillID);
								that.oPressDialog.close();

							},
							type: "Navigation"
						})
					}
				}),
				beginButton: new sap.m.Button({
					text: 'Close',
					press: function () {
						that.oPressDialog.close();
					}
				})
			});

			this.getView().addDependent(this.oPressDialog);
			this.oPressDialog.open();
		},

		onSelectOrgUnit: function () {
			var tree = sap.ui.getCore().byId("Tree");
			var selectedOrgObject = this.getView().getModel("OrgUnits").getProperty(tree.getSelectedContextPaths()[0]);
			var oBinding = this.byId("empCardList").getBinding("cards");

			// filter by Org Unit ID
			var oFilter = new sap.ui.model.Filter({
				filters: [
					new sap.ui.model.Filter("ObjidRef", sap.ui.model.FilterOperator.EQ, selectedOrgObject.id)
				],
				and: false
			});

			oBinding.filter(oFilter);

			// Update header with new employee counter and Org Unit text
			this.getView().getModel("viewModel").setProperty("/currentOrgUnitText", selectedOrgObject.text);
			this.getView().getModel("viewModel").setProperty("/employeesVisible", oBinding.iLength);

			this._orgPop.close();
		},

		onResetOrgSelection: function () {
			var tree = sap.ui.getCore().byId("Tree");
			tree.removeSelections();
			this.loadTeamData();
			this._orgPop.close();
		},

	});
});