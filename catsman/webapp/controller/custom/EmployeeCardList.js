//-----------------------------------------------------------------------
// Date: 21/09/2018
// BY: RQU (Ricardo Quintas)
// Overview:
// Custom controller for the list of cards. This controller will be the wrapper.
// It will use CSS flexbox
//-----------------------------------------------------------------------
sap.ui.define([
	"sap/ui/core/Control"
], function (Control) {
	"use strict";

	var EmployeeCardList = Control.extend("com.nn.cats.manager.controller.custom.EmployeeCardList", {
		metadata: {
			properties: {},
			aggregations: {
				"cards": {
					type: "com.nn.cats.manager.controller.custom.EmployeeCard",
					multiple: true,
					singularName: "card"
				}
			}
		},

		init: function () {

		},

		renderer: {
			render: function (oRm, oControl) {
				oRm.write("<div class='gavdi-employee-list'");
				oRm.writeControlData(oControl);
				oRm.write(">");

				//Create the cards
				$.each(oControl.getCards(), function (key, cardObj) {
					oRm.renderControl(cardObj);
				});

				oRm.write("</div>");
			}
		}
	});

	return EmployeeCardList;

});