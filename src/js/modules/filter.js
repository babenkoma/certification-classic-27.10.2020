/**
 * @fileOverview Модуль для работы с фильтром
 */

import $ from 'js#/lib/jquery';
import goods from 'js#/data/goods.json';

class Filter {
	constructor() {
		this.filter = $('#filter').get(0);

		if (!this.filter) {
			return;
		}

		this.$filter = $(this.filter);
		this.$pagination = $('#pagination');
		this.elements = this.filter?.elements;
		this.$cardTemplate = $(window.document.querySelector('#card-template')?.content);
		this.$paginationTemplate = $(window.document.querySelector('#pagination-template')?.content);
		this.$list = $('#card-list');
		this.list = goods || [];
		this.filterList = goods || [];
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
				page: 1
			}
		};
		this.data = this.assign(this.initialData);

		for (let i = 0; i < this.elements.length; i++) {
			$(this.elements[i]).on('change', () => {
				this.render();
			});
		}
		$(window.document).on('click', '#pagination [data-link]', (event) => {
			const $element = $(event.currentTarget);
			const page = +$element.data('link');
			this.data.pagination.page = page;
			this.render();
			return false;
		});
		this.render();
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

	filterData() {
		const filterList = this.list.filter((item) => {
			let isShow = true;

			if (this.data.params.brand.length && !this.data.params.brand.includes(String(item?.brand?.id))) {
				isShow = isShow && false;
			}

			if (this.data.params.manufacturer && String(this.data.params.manufacturer) !== String(item?.manufacturer?.id)) {
				isShow = isShow && false;
			}

			if (this.data.params.model && String(this.data.params.model) !== String(item?.model?.id)) {
				isShow = isShow && false;
			}

			if (this.data.params.year && String(this.data.params.year) !== String(item?.year)) {
				isShow = isShow && false;
			}

			if (!(item?.price?.value >= this.data.params.price[0] && item?.price?.value <= this.data.params.price[1])) {
				isShow = isShow && false;
			}

			return isShow;
		});

		filterList.sort((a, b) => {
			let A = null;
			let B = null;
			let asc = true;

			if (this.data.pagination.sort === 'price_asc') {
				A = a?.price?.value;
				B = b?.price?.value;
				asc = true;
			}

			if (this.data.pagination.sort === 'price_desc') {
				A = a?.price?.value;
				B = b?.price?.value;
				asc = false;
			}

			if (this.data.pagination.sort === 'new_asc') {
				A = a?.year;
				B = b?.year;
				asc = true;
			}

			if (this.data.pagination.sort === 'new_desc') {
				A = a?.year;
				B = b?.year;
				asc = false;
			}

			if (A > B) {
				return asc ? 1 : -1;
			} else if (A < B) {
				return asc ? -1 : 1;
			} else {
				return 0;
			}
		});

		return filterList;
	}

	setPagination() {
		const result = [];
		const perPage = this.data.pagination.perPage;
		const page = this.data.pagination.page;
		const length = this.filterList.length;

		const count = Math.ceil(length / perPage);

		let start = page - 2;
		let end = page + 2;
		if (start < 1) {
			start = 1;
		}
		if (end > count) {
			end = count;
		}

		if (count > 5 && start > 1) {
			result.push({
				href: '#',
				text: '<<',
				page: 1
			});
			result.push({
				href: '#',
				text: '<',
				page: page - 1 || 1
			});
		}
		for (let i = start; i <= end; i++) {
			result.push({
				href: i !== page ? '#' : '',
				text: i,
				page: i,
				active: i === page
			});
		}
		if (count > 5 && end < count) {
			result.push({
				href: '#',
				text: '>',
				page: page + 1 < count ? page + 1 : count
			});
			result.push({
				href: '#',
				text: '>>',
				page: count
			});
		}

		return result;
	}

	render() {
		this.data = this.getFilterData();
		console.log('send to server', this.data);

		const currentSearch = this.buildSearch(this.data);
		const initialSearch = this.buildSearch(this.initialData);
		const search = currentSearch !== initialSearch ? currentSearch : '';
		window.history.pushState({}, null, `${window.location.pathname}${search}`);

		this.$list.html('');
		const perPage = this.data.pagination.perPage;
		this.filterList = this.filterData();
		this.filterList.forEach((item, index) => {
			if (index < perPage) {
				const $card = this.$cardTemplate.clone();
				$card.find('[data-brand]').html(item?.brand?.name);
				$card
					.find('[data-image]')
					.attr('src', item?.image?.sizes['card-preview'])
					.attr('alt', item?.image?.alt);
				$card.find('[data-manufacturer]').html(item?.manufacturer?.name);
				$card.find('[data-year]').html(item?.year);
				$card.find('[data-model]').html(item?.model?.name);
				$card.find('[data-currency]').html(item?.price?.currency?.symbol);
				$card.find('[data-price]').html(item?.price?.value);

				this.$list.append($card);
			}
		});

		this.$pagination.html('');
		this.setPagination().forEach((item) => {
			const $paginationItem = this.$paginationTemplate.clone();
			const $item = $paginationItem.find('[data-link]');
			$item.html(item.text);
			$item.attr('link', item.page);
			if (item.href) {
				$item.attr('href', item.href);
			}
			if (item.active) {
				$item.addClass('is-active');
			}
			this.$pagination.append($paginationItem);
		});
	}
}

export default () => {
	const filter = new Filter();
	filter.$filter.data('instance', filter);
};
