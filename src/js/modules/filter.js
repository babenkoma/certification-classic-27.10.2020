/**
 * @fileOverview Модуль для работы с фильтром
 */

import $ from 'js#/lib/jquery';
import goods from 'js#/data/goods.json';

class Filter {
	constructor() {
		this.$filter = $('#filter');
		this.$pagination = $('#pagination');
		this.$list = $('#card-list');
		this.$brands = $('#brands');
		this.$reset = $('#filter-reset');

		if (!this.$filter.length) {
			return;
		}

		this.filter = this.$filter.get(0);
		this.elements = this.filter?.elements;
		this.$cardTemplate = $(window.document.querySelector('#card-template')?.content);
		this.$paginationTemplate = $(
			window.document.querySelector('#pagination-template')?.content
		);
		this.$checkboxTemplate = $(
			window.document.querySelector('#checkbox-template')?.content
		);
		this.list = goods || [];
		this.filterList = goods || [];
		this.page = 1;
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

		this.setFilters();
		this.setForm();

		this.initialData = () => ({
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
				page: this.page
			}
		});
		this.data = this.assign(this.initialData());

		for (let i = 0; i < this.elements.length; i++) {
			$(this.elements[i]).on('change', () => {
				this.page = 1;
				this.render();
			});
		}
		$(window.document).on('click', '#pagination [data-link]', (event) => {
			const $element = $(event.currentTarget);
			this.page = +$element.data('link');
			this.render();
			return false;
		});
		this.$reset.on('click', () => {
			this.setFilters();
			this.page = 1;
			const sort = $(this.elements.sort).find('option').eq(0).attr('value');
			const perPage = $(this.elements.per_page).find('option').eq(0).attr('value');
			$(this.elements.sort).val(sort);
			$(this.elements.per_page).val(perPage);
			this.data = this.assign(this.initialData());
			this.render();
		});

		this.render();
	}

	form2server(key) {
		const row = this.keys.find((item) => item.form === key);
		return row ? row.server : key;
	}

	param2form(key) {
		const row = this.keys.find((item) => item.param === key);
		return row ? row.form : key;
	}

	param2server(key) {
		const row = this.keys.find((item) => item.param === key);
		return row ? row.server : key;
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
		const formData = new window.FormData(this.filter);
		const data = this.assign(this.initialData());

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
		data.pagination.page = this.page;

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

			if (
				this.data.params.brand.length &&
				!this.data.params.brand.includes(String(item?.brand?.id))
			) {
				isShow = isShow && false;
			}

			if (
				this.data.params.manufacturer &&
				String(this.data.params.manufacturer) !== String(item?.manufacturer?.id)
			) {
				isShow = isShow && false;
			}

			if (
				this.data.params.model &&
				String(this.data.params.model) !== String(item?.model?.id)
			) {
				isShow = isShow && false;
			}

			if (
				this.data.params.year &&
				String(this.data.params.year) !== String(item?.year)
			) {
				isShow = isShow && false;
			}

			if (
				!(
					item?.price?.value >= this.data.params.price[0] &&
					item?.price?.value <= this.data.params.price[1]
				)
			) {
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
		const page = this.page;
		const length = this.filterList.length;

		const count = Math.ceil(length / perPage);

		let start = page - 2;
		if (start < 1) {
			start = 1;
		}
		let end = start + 4;
		if (end > count) {
			end = count;

			start = end - 4;
			if (start < 1) {
				start = 1;
			}
		}

		if (count > 5 && start > 1) {
			result.push({
				text: '<<',
				page: 1
			});
			result.push({
				text: '<',
				page: page - 1 || 1
			});
		}
		for (let i = start; i <= end; i++) {
			result.push({
				text: i,
				page: i,
				active: i === page
			});
		}
		if (count > 5 && end < count) {
			result.push({
				text: '>',
				page: page + 1 < count ? page + 1 : count
			});
			result.push({
				text: '>>',
				page: count
			});
		}

		return end > start ? result : [];
	}

	setForm() {
		const params = new window.URLSearchParams(
			window.document.location.search.substring(1)
		);

		this.$brands.find(`[name="brand[]"]`).prop('checked', false);
		for (const pair of params.entries()) {
			const key = this.param2form(pair[0].replace(/[[]]/g, ''));
			const server = this.param2server(pair[0].replace(/[[]]/g, ''));
			const value = this.getValue(server, pair[1]);

			if (key === 'brand') {
				this.$brands
					.find(`[name="brand[]"][value="${value}"]`)
					.prop('checked', true);
			}
			if (key === 'marka') {
				$(this.elements.marka).val(value);
			}
			if (key === 'filter-model') {
				$(this.elements['filter-model']).val(value);
			}
			if (key === 'year') {
				$(this.elements.year).val(value);
			}
			if (key === 'price-from') {
				$(this.elements['price-from']).val(value);
			}
			if (key === 'price-to') {
				$(this.elements['price-to']).val(value);
			}
			if (key === 'sort') {
				$(this.elements.sort).val(value);
			}
			if (key === 'per_page') {
				$(this.elements.per_page).val(value);
			}
			if (key === 'page') {
				this.page = value;
			}
		}
	}

	setFilters() {
		const $manufacturer = $(this.elements.marka);
		const $model = $(this.elements['filter-model']);
		const $priceFrom = $(this.elements['price-from']);
		const $priceTo = $(this.elements['price-to']);
		const $year = $(this.elements.year);

		this.$brands.html('');
		$manufacturer.html(`<option value="">Выбрать</option>`);
		$model.html(`<option value="">Выбрать</option>`);
		$year.html(`<option value="">Выбрать</option>`);

		const brands = [];
		const manufacturer = [];
		const model = [];
		const year = {};
		const years = [];
		let minPrice = +this.list[0]?.price?.value;
		let maxPrice = +this.list[0]?.price?.value;

		this.list.forEach((item) => {
			if (!brands.includes(item?.brand?.id)) {
				brands.push(item?.brand?.id);

				const checkboxItem = this.$checkboxTemplate.clone();
				checkboxItem
					.find('[data-checkbox]')
					.attr('name', 'brand[]')
					.attr('value', item?.brand?.id);
				checkboxItem.find('[data-text]').html(item?.brand?.name);
				this.$brands.append(checkboxItem);
			}

			if (!manufacturer.includes(item?.manufacturer?.id)) {
				manufacturer.push(item?.manufacturer?.id);

				$manufacturer.append(
					`<option value="${item?.manufacturer?.id}">${item?.manufacturer?.name}</option>`
				);
			}

			if (!model.includes(item?.model?.id)) {
				model.push(item?.model?.id);

				$model.append(
					`<option value="${item?.model?.id}">${item?.model?.name}</option>`
				);
			}

			if (+item?.price?.value < minPrice) {
				minPrice = +item?.price?.value;
			}

			if (+item?.price?.value > maxPrice) {
				maxPrice = +item?.price?.value;
			}

			if (!years.includes(item?.year)) {
				years.push(item?.year);
			}
		});

		$priceFrom.val(minPrice);
		$priceTo.val(maxPrice);
		years.sort();
		years.forEach((val) => {
			let key = '';
			if (val >= 1970 && val < 1980) {
				key = '70-ые';
				if (!year[key]) {
					year[key] = [];
				}
				year[key].push(val);
			}
			if (val >= 1980 && val < 1990) {
				key = '80-ые';
				if (!year[key]) {
					year[key] = [];
				}
				year[key].push(val);
			}
			if (val >= 1990 && val < 2000) {
				key = '90-ые';
				if (!year[key]) {
					year[key] = [];
				}
				year[key].push(val);
			}
			if (val >= 2000 && val < 2010) {
				key = '2k';
				if (!year[key]) {
					year[key] = [];
				}
				year[key].push(val);
			}
			if (val >= 2010 && val < 2020) {
				key = '2k10';
				if (!year[key]) {
					year[key] = [];
				}
				year[key].push(val);
			}
			if (val >= 2020 && val < 2030) {
				key = '2k20';
				if (!year[key]) {
					year[key] = [];
				}
				year[key].push(val);
			}
		});
		Object.keys(year).forEach((key) => {
			const options = year[key];
			const $optgroup = $(`<optgroup label="${key}"></optgroup>`);
			options.forEach((option) => {
				$optgroup.append(`<option value="${option}">${option}</option>`);
			});
			$year.append($optgroup);
		});
	}

	render() {
		this.data = this.getFilterData();
		console.log('send to server', this.data);

		const currentSearch = this.buildSearch(this.data);
		const initialSearch = this.buildSearch(this.initialData());
		const search = currentSearch !== initialSearch ? currentSearch : '';
		window.history.pushState({}, null, `${window.location.pathname}${search}`);

		if (this.$list.length) {
			this.$list.html('');
			const perPage = this.data.pagination.perPage;
			this.filterList = this.filterData();
			if (this.filterList.length) {
				const start = (this.page - 1) * perPage;
				const end = start + perPage;
				this.filterList.forEach((item, index) => {
					if (index >= start && index < end) {
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
			} else {
				this.$list.append(`<div class="_cell"><h3>Ничего не найдено!</h3></div>`);
			}
		}

		if (this.$pagination.length) {
			this.$pagination.html('');
			this.setPagination().forEach((item) => {
				const $paginationItem = this.$paginationTemplate.clone();
				const $item = $paginationItem.find('[data-link]');
				$item.html(item.text);
				$item.data('link', item.page);
				if (item.active) {
					$item.addClass('is-active');
				} else {
					$item.attr('href', '#');
				}
				this.$pagination.append($paginationItem);
			});
		}
	}
}

export default () => {
	const filter = new Filter();
	filter.$filter.data('instance', filter);
};
