//-----------------------------------------------------------------------
// Date: 21/09/2018
// BY: RQU (Ricardo Quintas)
// Overview:
// Custom controller for the individual "Card". It will use CSS flexbox
//-----------------------------------------------------------------------
sap.ui.define([
	"sap/ui/core/Control"
], function (Control) {
	"use strict";

	var EmployeeCard = Control.extend("com.nn.cats.manager.controller.custom.EmployeeCard", {
		metadata: {
			properties: {
				objId: {
					type: "string"
				},
				fullName: {
					type: "string"
				},
				userId: {
					type: "string"
				},
				skillID: {
					type: "string"
				},
				skillName: {
					type: "string"
				}
			},
			events: {
				clicked: {}
			}
		},

		renderer: {
			render: function (oRm, oControl) {
				var oButton = new sap.m.Button({
					// icon: "sap-icon://edit",
					text: "Edit",
					type: sap.m.ButtonType.Default,
					press: function () {
						oControl.fireEvent("clicked", null);
					}

				});

				oRm.write("<div class='gavdi-employee-card'"); // >> employee-card
				oRm.writeControlData(oControl);
				oRm.write(">");

				// Add the employee info
				oRm.write("<div class='gavdi-user-id'>");
				if (oControl.getUserId()) {
					oRm.write(oControl.getUserId());
				}
				oRm.write("</div>");

				oRm.write("<div class='gavdi-full-name'>");
				oRm.write(oControl.getFullName());
				oRm.write("</div>");

				oRm.write("<div class='gavdi-lower-part'>"); // >> lower-part
				oRm.write("<div class='gavdi-skill-id'>");
				oRm.write(oControl.getSkillID());
				oRm.write("</div>");
				oRm.write("<div class='gavdi-skill-name'>");
				oRm.write(oControl.getSkillName());
				oRm.write("</div>");
				oRm.write("<div class='gavdi-edit-button'>");
				oRm.renderControl(oButton);
				oRm.write("</div>");
				oRm.write("</div>"); // << lower-part

				oRm.write("</div>"); // << employee-card
			}
		}
	});

	return EmployeeCard;

});