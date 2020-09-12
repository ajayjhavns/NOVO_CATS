//# sourceURL=PictureUploader.js
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/base/Object",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	'sap/m/MessagePopover',
	'sap/m/MessageItem'
], function (jQuery, BaseObject, MessageToast, JSONModel, MessagePopover, MessageItem) {

	var ErrorHandler = BaseObject.extend("com.nn.cats.employee.classes.ErrorHandler", {
		constructor: function (comp, view) {
			this._comp = comp;
			this._view = view;
		},

		getMsgPopover: function () {
			return this.oMessagePopover;
		},

		_getMessagePopover: function () {
			if (!this.oMessagePopover) {
				this._oMessagePopover = sap.ui.xmlfragment(this._view.getId(),
					"com.nn.cats.employee.view.fragments.Messages", this);
				this._view.addDependent(this.oMessagePopover);
			}
			return this._oMessagePopover;
		},

		getMessageType: function (error, type) {
			var result = false;
			var errorObj = "";
			try {
				if (error) {
					errorObj = JSON.parse(error.responseText);
				}

				if (errorObj.error.innererror.errordetails[0]) {
					switch (type) {
					case this._comp.appconfig.actionSave:
						if (errorObj.error.innererror.errordetails[0].severity === "error") {
							result = false;
						} else {
							result = true;
						}
						break;
					default:
						this._comp.showMessageToast(errorObj.error.message.value, true);
						result = false;
						break;

					}
				}
			} catch (err) {
				this._comp.showMessageToast(error.responseText, true);
				result = false;
			}

			return result;
		},

		showMessage: function (error, type) {
			var errorObj = "";
			try {
				if (error) {
					errorObj = JSON.parse(error.responseText);
					if (errorObj.error.innererror.errordetails[0]) {
						if (errorObj.error.innererror.errordetails[0].severity === "error") {
							this._comp.showMessageToast(errorObj.error.message.value, true);
						}
					}
				}
			} catch (err) {
				this._comp.showMessageToast(error.responseText, true);
			}
		},

		getMessage: function (error) {
			var errorObj = "";
			try {
				if (error) {
					errorObj = JSON.parse(error.responseText);
					if (errorObj.error.innererror.errordetails[0]) {
						if (errorObj.error.innererror.errordetails[0].severity === "error") {
							return errorObj.error.message.value;
						}
					}
				}
			} catch (err) {
				return error.responseText;
			}
		}
	});

	return ErrorHandler;
});