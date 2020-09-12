sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/core/BusyIndicator",
	"com/nn/cats/manager/util/Utils"
], function (UIComponent, BusyIndicator, Utils) {
	"use strict";

	return UIComponent.extend("com.nn.cats.manager.Component", {

		metadata: {
			manifest: "json"
		},

		init: function () {
			// BusyIndicator.show(0);

			this.setMetaDataEventHandlers();

			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();
		},

		getsubAccount: function () {
			return window.location.host.split("-")[1].split(".")[0];
		},

		// Initialize metadata event handlers
		setMetaDataEventHandlers: function () {

			//Show busy while fetching the metadata
			this.getModel().attachMetadataLoaded(null, function () {
				// BusyIndicator.hide();
			}, null);

			//Hook up and send wait dialog when requests are sent
			this.getModel().attachRequestSent(null, function () {
				// BusyIndicator.show();
			}, null);

			// TODO: RQU delete this ?
			//Thigs we do when request is success
			this.getModel().attachRequestCompleted(null, function () {

			}, null);

			//Thigs we do when request is failed
			this.getModel().attachRequestFailed(null, function () {
				BusyIndicator.hide();
				// Utils.displayErrorPopup("Request failed");
			}, null);

			//Metadata failed event
			this.getModel().attachMetadataFailed(null, function () {
				BusyIndicator.hide();
				// Utils.displayErrorPopup("Connection Problems");
			}, null);

		},

		onExit: function () {
			UIComponent.prototype.destroy.apply(this, arguments);
		}
	});
});