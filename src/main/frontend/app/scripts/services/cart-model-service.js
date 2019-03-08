/* 
 * Data HUb Service (DHuS) - For Space data distribution.
 * Copyright (C) 2013,2014,2015,2016 European Space Agency (ESA)
 * Copyright (C) 2013,2014,2015,2016 GAEL Systems
 * Copyright (C) 2013,2014,2015,2016 Serco Spa
 * 
 * This file is part of DHuS software sources.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
(function () { 'use strict'; }());
angular.module('DHuS-webclient').factory('CartModel', function (CartStatusService, StyleService) {
	
	//CallEventXXX (Cart Model Service) -> EventXXX (Protocol) -> OnXXX (other component method, eg cart item or OlMap)
	var CartModelProtocol = {
		'clear-map': 'clearMap',
		'create': 'createdCartModel',
		'update': 'updatedCartModel',
		'delete': 'deletedCartModel',
		'EventHighlight': 'OnHighlight',
		'EventResetUi': 'OnResetUi',
		'EventSelectProduct': 'OnSelectProduct',
		'EventDeselectCurrentProduct': 'OnDeselectCurrentProduct'
	};
	var PolyStyles = null;
	var product_styles = {
		default_style: '',
		selected_style: '',
		highlighted_style: ''
	};

	return {
		model: { list: [], count: 0 },
		subscribers: [],
		createModel: function (model, count) {
			if (!PolyStyles) PolyStyles = StyleService.getDHuSStyles();
			this.model.list = model;
			this.model.count = count;
			for (var i = 0; i < this.model.list.length; i++) {
				var product_styles = StyleService.getStyleFromProduct(this.model.list[i]);
				this.model.list[i].default_style = product_styles.default_style;
				this.model.list[i].selected_style = product_styles.selected_style;
				this.model.list[i].highlighted_style = product_styles.highlighted_style;
				this.model.list[i].label_style = product_styles.label_style;
				this.model.list[i].instrlabel_style = product_styles.instrlabel_style;
			}

			var aSubscribers = [];
			for (var ii = 0; ii < this.subscribers.length; ii++)
				aSubscribers.push(this.subscribers[ii]);

			for (var jj = 0; jj < aSubscribers.length; jj++)
				if (aSubscribers[jj].id && aSubscribers[jj].id == 'cartItem')
					this.unsub(aSubscribers[jj]);

			aSubscribers = null;
			this.pub('create');
		},

		readModel: function () { return this.model; },
		updateModel: function (model) { },
		deleteModel: function () { },
		getProductIndexByUUID: function (uuid) {
			var self = this;
			return _.findIndex(self.model.list, function (element) {
				return (element.uuid == uuid);
			});
		},

		getProductByIndex: function (index) { return this.model.list[index]; },
		getProductByUUID: function (uuid) { return this.getProductByIndex(this.getProductIndexByUUID(uuid)); },

		//METHOD USED BY CART ITEM COMPONENTS
		callEventHighlightProduct: function (param) {
			var self = this;
			var index = self.getProductIndexByUUID(param.uuid);
			self.model.list[index].highlight = true;
			self.pub('EventHighlight', param);
		},

		callEventSelectProduct: function (param) {
			var self = this;
			if (CartStatusService.getCartFootprints() == true) {
				var index = self.getProductIndexByUUID(param.uuid);
				if (self.model.list[index].selected == true) return; //dont perform actions if item is alreay selected
				for (var i = 0; i < self.model.list.length; i++)
					self.model.list[i].selected = false;
				self.model.list[index].selected = true; //Select this item
				self.pub('EventSelectProduct', param);
			} else {}
				// ToastManager.error("Search Selection disabled when cart footprints are not displayed"); //also use pub/sub ?
		},

		callEventDeselectCurrentProduct: function (param) {
			var self = this;
			var index = self.getProductIndexByUUID(param.uuid);
			self.model.list[index].selected = false;
			self.pub('EventDeselectCurrentProduct', param);
		},

		//Restore Default UI
		callEventResetUi: function (param) {
			var self = this;
			var index = self.getProductIndexByUUID(param.uuid);
			self.model.list[index].highlight = false;
			self.pub('EventResetUi', param);
		},

		//Used by OLMap
		deselectAll: function (param) {
			var self = this;
			for (var i = 0; self.model.list && i < self.model.list.length; i++)
				self.model.list[i].selected = false;
			self.pub('EventSelectProduct', param);
		},

		/* PUB-SUB Design Pattern */
		sub: function (delegate) { this.subscribers.push(delegate); },
		unsub: function (element) { this.subscribers.splice(this.subscribers.indexOf(element), 1); },
		pub: function (method, param) {
			var self = this;
			for (var i = 0; i < self.subscribers.length; i++)
				if (typeof self.subscribers[i][CartModelProtocol[method]] == 'function')
					self.subscribers[i][CartModelProtocol[method]](param);
		}
	};
});