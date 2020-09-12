//-----------------------------------------------------------------------
// Date: 01/10/2018
// BY: RQU (Ricardo Quintas)
// Overview:
// This file has all the code to deal with the oData for this particular service/object
//-----------------------------------------------------------------------
sap.ui.define(
	[
		'sap/ui/model/Filter'
	],
	function (Filter) {
		'use strict';

		return {

			updateSkill: function (oModel, oSelectedObj, sNewText) {
				return new Promise(function (resolve, reject) {

					var sPath = oModel.createKey('/SkillSet', {
						Objid: oSelectedObj.Objid,
						Otype: oSelectedObj.Otype
					});

					var obj = {
						Objid: oSelectedObj.Objid,
						Stext: sNewText,
						Begda: oSelectedObj.Begda,
						Endda: oSelectedObj.Endda
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
			},

			deleteSkill: function (oModel, oSelectedObj) {
				return new Promise(function (resolve, reject) {

					var sPath = oModel.createKey('/SkillSet', {
						Objid: oSelectedObj.Objid,
						Otype: oSelectedObj.Otype
					});

					var success = function (oData) {
						resolve(oData);
					};

					var error = function (oErr) {
						reject(oErr);
					};

					oModel.remove(sPath, {
						success: success,
						error: error
					});
				});
			},

			createSkill: function (oModel, sSkillText, sSkillGroupID) {
				return new Promise(function (resolve, reject) {

					var obj = {
						// Objid: "",
						PupObjid: sSkillGroupID,
						Stext: sSkillText
					};

					var success = function (oData) {
						resolve(oData);
					};

					var error = function (oErr) {
						reject(oErr);
					};

					oModel.create('/SkillSet', obj, {
						success: success,
						error: error
					});

				});
			},

			getSkills: function (oModel) {

				return new Promise(function (resolve, reject) {

					var success = function (oData) {
						resolve(oData);
					};

					var error = function (oErr) {
						reject(oErr);
					};

					oModel.read('/SkillSet', {
						success: success,
						error: error
					});

				});
			}
		};
	}
);