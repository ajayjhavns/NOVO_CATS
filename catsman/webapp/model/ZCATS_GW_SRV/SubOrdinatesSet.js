//-----------------------------------------------------------------------
// Date: 21/09/2018
// BY: RQU (Ricardo Quintas)
// Overview:
// This file has all the code to deal with the oData
//-----------------------------------------------------------------------
sap.ui.define(
	[
		'sap/ui/model/Filter'
	],
	function (Filter) {
		'use strict';

		return {
			updateSkill: function (oModel, sObjid, sEmployeeID, sSkillID) {
				return new Promise(function (resolve, reject) {
					var sPath = oModel.createKey('/SubOrdinatesSet', {
						Objid: sObjid
					});

					var obj = {
						Objid: sObjid,
						Usrid: sEmployeeID,
						SkillId: sSkillID
					};

					var success = function (oData) {
						resolve(oData);
					};

					var error = function (oErr) {
						reject(oErr);
					};

					oModel.update(sPath, obj, {
						success: success,
						error: error
					});

				});
			}
		};
	}
);