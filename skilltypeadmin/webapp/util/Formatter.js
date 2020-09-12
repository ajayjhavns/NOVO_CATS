//-----------------------------------------------------------------------
// Date: 21/09/2018
// BY: RQU (Ricardo Quintas)
// Overview:
// Formatter related functions
//-----------------------------------------------------------------------

sap.ui.define([], function () {
	'use strict';
	return {
		// Normalizes and cleans the SkillID or Skill Text
		normalizeSkill: function (str) {
			if (str === null || str === "00000000") {
				return "";
			}
			return str;
		},

		// Normalizes and cleans the Usrid
		normalizeUsrid: function (str) {
			if (str === null || str === "") {
				return "- -";
			}
			return str;
		}

	};
});