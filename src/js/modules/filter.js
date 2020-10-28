/**
 * @fileOverview Модуль для работы с фильтром
 */

import $ from 'js#/lib/jquery';

class Filter {
	constructor(formSelector, paginationSelector) {
		this.filter = $(formSelector).get(0);

		if (!this.filter) {
			return;
		}

		this.$filter = $(this.filter);
		this.$pagination = $(paginationSelector);
		this.elements = this.filter?.elements || [];
		this.keys = [
			{ form: 'brand', server: 'brand', param: 'brand', type: 'string' },
			{
				form: 'marka',
				server: 'manufacturer',
				param: 'manufacturer',
				type: 'string'
			},
			{ form: 'filter-model', server: 'model', param: 'model', type: 'string' },
			{ form: 'year', server: 'year', param: 'year', type: 'number' },
			{
				form: 'price-from',
				server: 'priceFrom',
				param: 'price-from',
				type: 'number'
			},
			{ form: 'price-to', server: 'priceTo', param: 'price-to', type: 'number' },
			{ form: 'sort', server: 'sort', param: 'sort', type: 'string' },
			{ form: 'per_page', server: 'perPage', param: 'per-page', type: 'number' },
			{ form: 'page', server: 'page', param: 'page', type: 'number' },
			{ form: 'price', server: 'price', param: 'price', type: 'number' }
		];
		this.params = [
			'page',
			'year',
			'price',
			'model',
			'manufacturer',
			'brand',
			'sort',
			'per-page'
		];
		this.initialData = {
			params: {
				brand: [],
				manufacturer: '',
				model: '',
				year: 0,
				price: [
					+this.elements['price-from'].value,
					+this.elements['price-to'].value
				]
			},
			pagination: {
				sort: this.elements.sort.value,
				perPage: +this.elements.per_page.value,
				page: +this.$pagination.find('.is-active').text()
			}
		};

		for (let i = 0; i < this.elements.length; i++) {
			$(this.elements[i]).on('change', () => {
				this.filtering();
			});
		}
	}

	form2server(key) {
		const row = this.keys.find((item) => item.form === key);
		return row ? row.server : key;
	}

	server2form(key) {
		const row = this.keys.find((item) => item.server === key);
		return row ? row.form : key;
	}

	getValue(key, value) {
		const row = this.keys.find((item) => item.server === key);
		if (!row) {
			return null;
		}
		if (row.type === 'string') {
			return String(value);
		}
		if (row.type === 'number') {
			return +value;
		}
	}

	assign(obj) {
		return JSON.parse(JSON.stringify(obj));
	}

	getFilterData() {
		const formData = new FormData(this.filter);
		const data = this.assign(this.initialData);

		let priceFrom = 0;
		let priceTo = 0;
		for (const pair of formData.entries()) {
			const isArray = /[[]]/g.test(pair[0]);
			const key = this.form2server(pair[0].replace(/[[]]/g, ''));
			const value = this.getValue(key, pair[1]);

			if (['sort', 'perPage'].includes(key)) {
				data.pagination[key] = value;
			} else if (['priceFrom', 'priceTo'].includes(key)) {
				if (key === 'priceFrom') {
					priceFrom = value;
				}
				if (key === 'priceTo') {
					priceTo = value;
				}
			} else {
				if (isArray) {
					data.params[key].push(value);
				} else {
					data.params[key] = value;
				}
			}
		}
		data.params.price = [priceFrom, priceTo];

		return data;
	}

	data2obj(data) {
		const allData = {};
		Object.keys(data.params).forEach((key) => {
			allData[key] = data.params[key];
		});
		Object.keys(data.pagination).forEach((key) => {
			allData[key] = data.pagination[key];
		});
		return allData;
	}

	buildSearch(data) {
		const params = [];
		const allData = this.data2obj(data);
		this.params.forEach((param) => {
			const row = this.keys.find((item) => item.param === param);
			const key = row.server;
			const value = allData[key];
			if (Array.isArray(value)) {
				value.forEach((val) => {
					if (val) {
						params.push(`${param}[]=${val}`);
					}
				});
			} else {
				if (value) {
					params.push(`${param}=${value}`);
				}
			}
		});
		return params.length ? `?${params.join('&')}` : '';
	}

	filtering() {
		const data = this.getFilterData();
		console.log('send to server', data);

		const currentSearch = this.buildSearch(data);
		const initialSearch = this.buildSearch(this.initialData);
		console.log(currentSearch);
		console.log(initialSearch);
		const search = currentSearch !== initialSearch ? currentSearch : '';
		window.history.pushState({}, null, `${window.location.pathname}${search}`);
	}
}

export default () => {
	const filter = new Filter('#filter', '#pagination');
	filter.$filter.data('instance', filter);
};
