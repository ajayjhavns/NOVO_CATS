sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/core/BusyIndicator",
	"com/nn/cats/SkillTypeAdmin/util/Utils"
], function (UIComponent, BusyIndicator, Utils) {
	"use strict";

	return UIComponent.extend("com.nn.cats.SkillTypeAdmin.Component", {

		metadata: {
			manifest: "json"
		},

		i18n: null,

		init: function () {

			this.i18n = this.getModel('i18n').getResourceBundle();

			this.setMetaDataEventHandlers();

			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			var oRouter = this.getRouter();
			if (oRouter) {
				oRouter.initialize();
			}
		},

		getsubAccount: function () {
			return window.location.host.split("-")[1].split(".")[0];
		},

		// Initialize metadata event handlers
		setMetaDataEventHandlers: function () {
			//Thigs we do when request is failed
			this.getModel().attachRequestFailed(null, function () {
				BusyIndicator.hide();
				// Utils.displayErrorPopup(this.i18n.getText("requestFailed"));
			}, null);

			//Metadata failed event
			this.getModel().attachMetadataFailed(null, function () {
				BusyIndicator.hide();
				// Utils.displayErrorPopup(this.i18n.getText("connectionProblems"));
			}, null);

		},

		onExit: function () {
			UIComponent.prototype.destroy.apply(this, arguments);
		}
	});

});