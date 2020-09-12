//-----------------------------------------------------------------------
// Date: 21/09/2018
// BY: RQU (Ricardo Quintas)
// Overview:
// Here we gather assorted funtions to be used across the entire app
//-----------------------------------------------------------------------
sap.ui.define([], function () {
	'use strict';

	return {

		displayErrorPopup: function (sMessage, oError) {
			var obj;
			var sSapMessageText = "";
			var sSapMessageTechDetails = ""; // includes the message CLASS and Message ID
			var sPopupText = "";

			// Extract SAP message info
			if (oError && oError.responseText) {
				obj = JSON.parse(oError.responseText);
				if (obj) {
					sSapMessageText = obj.error.message.value;
					sSapMessageTechDetails = obj.error.code;
				}
			}

			if (sSapMessageText !== "") {
				sPopupText = sMessage + "\n\nSAP Backend Error:\n" + sSapMessageTechDetails + "\n" + sSapMessageText;
			} else {
				sPopupText = sMessage;
			}

			var oDialog = new sap.m.Dialog({
				title: 'Error',
				type: 'Message',
				state: 'Error',
				content: new sap.m.Text({
					text: sPopupText
				}),
				beginButton: new sap.m.Button({
					text: 'OK',
					press: function () {
						oDialog.close();
					}
				}),
				afterClose: function () {
					oDialog.destroy();
				}
			});

			oDialog.open();
		}
	};
});