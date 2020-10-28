/**
 * @fileOverview Модуль для работы с фильтром
 */

import $ from 'js#/lib/jquery';

class Filter {
	constructor(selector) {
		this.$filter = $(selector);
		this.keys = [
			{ form: 'brand', server: 'brand', type: 'string' },
			{ form: 'marka', server: 'manufacturer', type: 'string' },
			{ form: 'filter-model', server: 'model', type: 'string' },
			{ form: 'year', server: 'year', type: 'number' },
			{ form: 'price-from', server: 'priceFrom', type: 'number' },
			{ form: 'price-to', server: 'priceTo', type: 'number' },
			{ form: 'sort', server: 'sort', type: 'string' },
			{ form: 'per_page', server: 'perPage', type: 'number' }
		];
		this.initialData = {
			params: {
				brand: [],
				manufacturer: '',
				model: '',
				year: 1973,
				price: []
			},
			pagination: {
				sort: 'price_asc',
				perPage: 6,
				page: 1
			}
		};

		const elements = this.$filter.get(0).elements;
		for (let i = 0; i < elements.length; i++) {
			$(elements[i]).on('change', () => {
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
		const formData = new FormData(this.$filter.get(0));
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

	filtering() {
		const data = this.getFilterData();
		console.log('send to server', data);
	}
}

export default () => {
	const filter = new Filter('#filter');
	filter.$filter.data('instance', filter);
};
