// src/services/filmManager.js
import { PARTNERS } from '../utils/constants';

class FilmManager {
  constructor() {
    // API через прокси (без прямых ключей!)
    this.API_URL = '/api';
    this.SEARCH_API_URL = '/functions/v1/search-movie';
    
    this.currentMovieId = null;
    this.films = [];
    this.customRows = {};
    this.apiCache = new Map();
    this.cacheDuration = 24 * 60 * 60 * 1000;
    
    this.loadFromCache();
  }
  
  loadFromCache() {
    try {
      const cachedFilms = localStorage.getItem('vzorkino_films_cache');
      if (cachedFilms) {
        this.films = JSON.parse(cachedFilms).map(film => this.normalizeFilmData(film));
        if (this.films.length > 0) {
          console.log(`📦 Фильмов в кэше: ${this.films.length}`);
        }
      }
      
      const cachedRows = localStorage.getItem('vzorkino_custom_rows');
      if (cachedRows) {
        this.customRows = JSON.parse(cachedRows);
        if (Object.keys(this.customRows).length > 0) {
          console.log(`📦 Рядов в кэше: ${Object.keys(this.customRows).length}`);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки кэша:', error);
    }
  }
  
  async init() {
    console.time('Инициализация FilmManager');
    
    if (this.films.length > 0) {
      this.preloadImages();
    }
    
    await this.cleanupOrphanedFilmReferences();
    await this.loadFreshDataInBackground();
    
    console.timeEnd('Инициализация FilmManager');
    return this;
  }
  
  async loadFreshDataInBackground() {
    try {
      const [films, rows] = await Promise.allSettled([
        this.loadFilmsFromAPI(),
        this.loadCustomRowsFromAPI()
      ]);
      
      if (films.status === 'fulfilled' && films.value && films.value.length > 0) {
        this.films = films.value;
        localStorage.setItem('vzorkino_films_cache', JSON.stringify(this.films));
      }
      
      if (rows.status === 'fulfilled' && rows.value) {
        this.syncCustomRows(rows.value);
      }
    } catch (error) {
      console.error('Ошибка фоновой загрузки:', error);
    }
  }
  
  // ============ API METHODS (через прокси, без ключей) ============
  
  async loadFilmsFromAPI() {
    try {
      const response = await fetch(`${this.API_URL}/films?select=*&order=created_at.desc`);
      
      if (response.ok) {
        const films = await response.json();
        return films.map(film => this.normalizeFilmData(film));
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Ошибка загрузки фильмов:', error);
      return this.films;
    }
  }
  
  async loadCustomRowsFromAPI() {
    try {
      const response = await fetch(`${this.API_URL}/custom_rows?select=*&order=created_at.desc`);
      
      if (response.ok) {
        const rows = await response.json();
        const apiRows = {};
        
        rows.forEach(row => {
          apiRows[row.id] = {
            id: row.id,
            name: row.name,
            pageType: row.page_type || 'all',
            maxRowItems: row.max_row_items || 20,
            rowItems: row.row_items || [],
            modalItems: row.modal_items || [],
            isGlobal: row.is_global !== false,
            userId: row.user_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          };
        });
        
        return apiRows;
      }
    } catch (error) {
      console.error('Ошибка загрузки рядов:', error);
      return this.customRows;
    }
  }
  
  async saveCustomRowToAPI(rowData) {
    try {
      const response = await fetch(`${this.API_URL}/custom_rows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          id: rowData.id,
          name: rowData.name,
          page_type: rowData.pageType,
          max_row_items: rowData.maxRowItems,
          row_items: rowData.rowItems,
          modal_items: rowData.modalItems,
          is_global: rowData.isGlobal,
          user_id: 'admin',
          created_at: rowData.createdAt,
          updated_at: rowData.updatedAt
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Ошибка сохранения ряда:', error);
      return false;
    }
  }
  
  async updateCustomRowInAPI(rowId, updates) {
    try {
      const apiUpdates = {};
      
      if (updates.rowItems !== undefined) apiUpdates.row_items = updates.rowItems;
      if (updates.modalItems !== undefined) apiUpdates.modal_items = updates.modalItems;
      if (updates.name !== undefined) apiUpdates.name = updates.name;
      if (updates.pageType !== undefined) apiUpdates.page_type = updates.pageType;
      if (updates.maxRowItems !== undefined) apiUpdates.max_row_items = updates.maxRowItems;
      
      apiUpdates.updated_at = new Date().toISOString();
      
      const response = await fetch(`${this.API_URL}/custom_rows?id=eq.${rowId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiUpdates)
      });
      
      return response.ok;
    } catch (error) {
      console.error('Ошибка обновления ряда:', error);
      return false;
    }
  }
  
  async deleteCustomRowFromAPI(rowId) {
    try {
      const response = await fetch(`${this.API_URL}/custom_rows?id=eq.${rowId}`, {
        method: 'DELETE'
      });
      
      return response.ok;
    } catch (error) {
      console.error('Ошибка удаления ряда:', error);
      return false;
    }
  }
  
  async saveFilmToAPI(film) {
    try {
      const filmData = {
        title: film.title || '',
        year: parseInt(film.year) || new Date().getFullYear(),
        rating: parseFloat(film.rating) || 7.0,
        genre: film.genre || 'Фильм',
        duration: film.duration || '120 мин',
        country: film.country || 'Россия',
        partner: film.partner || 'okko',
        img: film.img || this.generatePlaceholder(film.title),
        description: film.description || `Фильм "${film.title}"`,
        director: film.director || 'Режиссер',
        actors: film.actors || 'Актеры',
        content_type: film.contentType || 'movie',
        seasons: parseInt(film.seasons) || 1,
        episodes: parseInt(film.episodes) || 1,
        kp_id: film.kpId || null,
        featured_data: film.featuredRows || [],
        partner_data: film.partnerLinks || {},
        tags: film.tags || [],
        reviews: film.reviews || [],
        user_ratings: film.userRatings || [],
        backdrop_url: film.backdropUrl || null,
        age_rating: film.ageRating || '16+',
        trailer_url: film.trailerUrl || null
      };
      
      Object.keys(filmData).forEach(key => {
        if (filmData[key] === undefined) delete filmData[key];
      });
      
      const response = await fetch(`${this.API_URL}/films`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(filmData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ошибка ответа API:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      const normalizedFilm = this.normalizeFilmData(result[0]);
      
      this.films.unshift(normalizedFilm);
      localStorage.setItem('vzorkino_films_cache', JSON.stringify(this.films));
      
      return normalizedFilm;
    } catch (error) {
      console.error('Ошибка сохранения фильма:', error);
      throw error;
    }
  }
  
  async updateFilmInAPI(filmId, updates) {
    try {
      const apiUpdates = {};
      Object.keys(updates).forEach(key => {
        if (key === 'contentType') apiUpdates.content_type = updates[key];
        else if (key === 'partnerLinks') apiUpdates.partner_data = updates[key];
        else if (key === 'userRatings') apiUpdates.user_ratings = updates[key];
        else if (key === 'featuredRows') apiUpdates.featured_data = updates[key];
        else if (key === 'ageRating') apiUpdates.age_rating = updates[key];
        else if (key === 'trailerUrl') apiUpdates.trailer_url = updates[key];
        else apiUpdates[key] = updates[key];
      });
      
      const response = await fetch(`${this.API_URL}/films?id=eq.${filmId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...apiUpdates,
          updated_at: new Date().toISOString()
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Ошибка обновления:', error);
      return false;
    }
  }
  
  async deleteFilmFromAPI(filmId) {
    try {
      const response = await fetch(`${this.API_URL}/films?id=eq.${filmId}`, {
        method: 'DELETE'
      });
      
      return response.ok;
    } catch (error) {
      console.error('Ошибка удаления фильма:', error);
      return false;
    }
  }
  
  // ============ ПОИСК ЧЕРЕЗ ПРОКСИ ============
  
  async searchPoiskKino(title, year = null, contentType = "movie") {
    try {
      let searchUrl = `${this.SEARCH_API_URL}/search?query=${encodeURIComponent(title)}`;
      if (year) searchUrl += `&year=${year}`;
      searchUrl += `&type=${contentType}`;
      
      const searchResponse = await fetch(searchUrl);
      
      if (!searchResponse.ok) {
        throw new Error(`HTTP error! status: ${searchResponse.status}`);
      }
      
      const searchData = await searchResponse.json();
      
      if (searchData.docs && searchData.docs.length > 0) {
        let bestMatch = searchData.docs[0];
        
        const typeMap = {
          'movie': 'movie',
          'series': 'tv-series',
          'cartoon': 'animated-series'
        };
        const apiType = typeMap[contentType] || 'movie';
        
        const typeMatches = searchData.docs.filter(movie => movie.type === apiType);
        if (typeMatches.length > 0) bestMatch = typeMatches[0];
        
        if (year) {
          const exactYearMatch = searchData.docs.find(movie => movie.year == year);
          if (exactYearMatch) bestMatch = exactYearMatch;
        }
        
        const movieId = bestMatch.id;
        const fullData = await this.getFullMovieData(movieId);
        
        if (fullData) {
          return this.formatPoiskKinoData(fullData, contentType);
        } else {
          return this.formatPoiskKinoData(bestMatch, contentType);
        }
      }
      
      return null;
    } catch (error) {
      console.error('API ошибка:', error);
      return null;
    }
  }
  
  async getFullMovieData(movieId) {
    try {
      const response = await fetch(`${this.SEARCH_API_URL}/movie?id=${movieId}`);
      
      if (response.ok) {
        return await response.json();
      } else {
        console.warn(`Не удалось получить полные данные для фильма ${movieId}`);
        return null;
      }
    } catch (error) {
      console.error('Ошибка получения полных данных фильма:', error);
      return null;
    }
  }
  
  // ============ ОСНОВНЫЕ МЕТОДЫ (сохранены из оригинала) ============
  
  syncCustomRows(apiRows) {
    const mergedRows = { ...this.customRows };
    
    Object.keys(apiRows).forEach(rowId => {
      if (!mergedRows[rowId]) {
        mergedRows[rowId] = apiRows[rowId];
      } else {
        const localRow = mergedRows[rowId];
        const apiRow = apiRows[rowId];
        
        if (apiRow.updatedAt > localRow.updatedAt) {
          mergedRows[rowId] = apiRow;
        }
      }
    });
    
    this.customRows = mergedRows;
    this.saveCustomRowsToLocal();
    
    return true;
  }
  
  saveCustomRowsToLocal() {
    try {
      localStorage.setItem('vzorkino_custom_rows', JSON.stringify(this.customRows));
    } catch (error) {
      console.error('Ошибка сохранения рядов:', error);
    }
  }
  
  createCustomRow(rowId, name, pageType = 'all', maxRowItems = 20) {
    const newRow = {
      id: rowId,
      name: name,
      pageType: pageType,
      maxRowItems: maxRowItems,
      rowItems: [],
      modalItems: [],
      isGlobal: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.customRows[rowId] = newRow;
    this.saveCustomRowsToLocal();
    
    setTimeout(async () => {
      const success = await this.saveCustomRowToAPI(newRow);
      if (success) console.log('✅ Ряд синхронизирован');
    }, 50);
    
    return newRow;
  }
  
  deleteCustomRow(rowId) {
    if (this.customRows[rowId]) {
      delete this.customRows[rowId];
      this.saveCustomRowsToLocal();
      
      setTimeout(async () => {
        const success = await this.deleteCustomRowFromAPI(rowId);
        if (success) console.log('✅ Ряд удален');
      }, 50);
      
      return true;
    }
    return false;
  }
  
  addToCustomRowModal(rowId, filmId) {
    if (!this.customRows[rowId]) return false;
    
    if (!this.customRows[rowId].modalItems.includes(filmId)) {
      this.customRows[rowId].modalItems.push(filmId);
      this.saveCustomRowsToLocal();
      
      setTimeout(async () => {
        await this.updateCustomRowInAPI(rowId, {
          modalItems: this.customRows[rowId].modalItems
        });
      }, 50);
      
      return true;
    }
    return false;
  }
  
  removeFromCustomRowModal(rowId, filmId) {
    if (!this.customRows[rowId]) return false;
    
    this.customRows[rowId].modalItems = this.customRows[rowId].modalItems.filter(id => id !== filmId);
    this.customRows[rowId].rowItems = this.customRows[rowId].rowItems.filter(id => id !== filmId);
    this.saveCustomRowsToLocal();
    
    setTimeout(async () => {
      await this.updateCustomRowInAPI(rowId, {
        modalItems: this.customRows[rowId].modalItems,
        rowItems: this.customRows[rowId].rowItems
      });
    }, 50);
    
    return true;
  }
  
  addToCustomRowDisplay(rowId, filmId) {
    if (!this.customRows[rowId]) return false;
    
    if (!this.customRows[rowId].modalItems.includes(filmId)) {
      this.customRows[rowId].modalItems.push(filmId);
    }
    
    if (!this.customRows[rowId].rowItems.includes(filmId) && 
        this.customRows[rowId].rowItems.length < this.customRows[rowId].maxRowItems) {
      this.customRows[rowId].rowItems.push(filmId);
      this.saveCustomRowsToLocal();
      
      setTimeout(async () => {
        await this.updateCustomRowInAPI(rowId, {
          modalItems: this.customRows[rowId].modalItems,
          rowItems: this.customRows[rowId].rowItems
        });
      }, 50);
      
      return true;
    }
    return false;
  }
  
  removeFromCustomRowDisplay(rowId, filmId) {
    if (!this.customRows[rowId]) return false;
    
    this.customRows[rowId].rowItems = this.customRows[rowId].rowItems.filter(id => id !== filmId);
    this.saveCustomRowsToLocal();
    
    setTimeout(async () => {
      await this.updateCustomRowInAPI(rowId, {
        rowItems: this.customRows[rowId].rowItems
      });
    }, 50);
    
    return true;
  }
  
  getCustomRow(rowId) {
    return this.customRows[rowId] || null;
  }
  
  getAllCustomRows() {
    return this.customRows;
  }
  
  getCustomRowsForPage(pageType) {
    const rows = {};
    Object.keys(this.customRows).forEach(rowId => {
      if (this.customRows[rowId].pageType === pageType) {
        rows[rowId] = this.customRows[rowId];
      }
    });
    return rows;
  }
  
  getCustomRowFilms(rowId, type = 'row') {
    if (!this.customRows[rowId]) return [];
    
    const filmIds = type === 'row' ? this.customRows[rowId].rowItems : this.customRows[rowId].modalItems;
    
    return filmIds
      .map(filmId => this.films.find(film => film.id == filmId))
      .filter(film => film !== undefined);
  }
  
  getAllCustomRowFilms(rowId) {
    if (!this.customRows[rowId]) return [];
    
    const allFilmIds = [...new Set([
      ...(this.customRows[rowId].rowItems || []),
      ...(this.customRows[rowId].modalItems || [])
    ])];
    
    return allFilmIds
      .map(filmId => this.films.find(f => f.id == filmId))
      .filter(film => film !== undefined);
  }
  
  async deleteFilm(filmId) {
    try {
      await this.removeFilmFromAllRows(filmId);
      
      this.films = this.films.filter(film => film.id != filmId);
      localStorage.setItem('vzorkino_films_cache', JSON.stringify(this.films));
      
      setTimeout(async () => {
        const success = await this.deleteFilmFromAPI(filmId);
        if (success) console.log('✅ Фильм удален');
      }, 50);
      
      return true;
    } catch (error) {
      console.error('Ошибка удаления фильма:', error);
      return false;
    }
  }
  
  async removeFilmFromAllRows(filmId) {
    try {
      Object.keys(this.customRows).forEach(rowId => {
        const row = this.customRows[rowId];
        
        if (row.rowItems && row.rowItems.includes(filmId)) {
          row.rowItems = row.rowItems.filter(id => id != filmId);
        }
        
        if (row.modalItems && row.modalItems.includes(filmId)) {
          row.modalItems = row.modalItems.filter(id => id != filmId);
        }
        
        this.customRows[rowId] = row;
        
        setTimeout(async () => {
          await this.updateCustomRowInAPI(rowId, {
            rowItems: row.rowItems,
            modalItems: row.modalItems
          });
        }, 50);
      });
      
      localStorage.setItem('vzorkino_custom_rows', JSON.stringify(this.customRows));
      
      return true;
    } catch (error) {
      console.error('Ошибка удаления фильма из рядов:', error);
      return false;
    }
  }
  
  async cleanupOrphanedFilmReferences() {
    try {
      const filmIds = this.films.map(f => f.id.toString());
      let cleanedCount = 0;
      
      Object.keys(this.customRows).forEach(rowId => {
        const row = this.customRows[rowId];
        
        if (row.rowItems && row.rowItems.length > 0) {
          const originalLength = row.rowItems.length;
          row.rowItems = row.rowItems.filter(filmId => filmIds.includes(filmId.toString()));
          cleanedCount += (originalLength - row.rowItems.length);
        }
        
        if (row.modalItems && row.modalItems.length > 0) {
          const originalLength = row.modalItems.length;
          row.modalItems = row.modalItems.filter(filmId => filmIds.includes(filmId.toString()));
          cleanedCount += (originalLength - row.modalItems.length);
        }
        
        this.customRows[rowId] = row;
      });
      
      if (cleanedCount > 0) {
        console.log(`🧹 Очищено ${cleanedCount} ссылок на несуществующие фильмы`);
        localStorage.setItem('vzorkino_custom_rows', JSON.stringify(this.customRows));
      }
      
      return cleanedCount;
    } catch (error) {
      console.error('Ошибка очистки ссылок:', error);
      return 0;
    }
  }
  
  getTemplate() {
    return {
      id: null,
      title: "",
      year: new Date().getFullYear(),
      rating: 7.0,
      genre: "Фильм",
      duration: "120 мин",
      country: "США",
      partner: "okko",
      img: this.generatePlaceholder(""),
      description: "",
      director: "",
      actors: "",
      reviews: [],
      tags: [],
      userRatings: [],
      createdAt: new Date().toISOString(),
      contentType: "movie",
      seasons: 1,
      episodes: 1,
      partnerLinks: {
        okko: "",
        ivi: "",
        wink: "",
        kion: "",
        premier: "",
        kinopoisk: ""
      },
      featuredRows: [],
      backdropUrl: null,
      ageRating: '16+',
      trailerUrl: null
    };
  }
  
  async autoAddFilm(movieTitle, year = null, contentType = "movie") {
    try {
      const filmData = await this.searchPoiskKino(movieTitle, year, contentType);
      
      if (filmData) {
        const fullData = await this.getFullMovieData(filmData.kpId);
        
        if (fullData) {
          const partnerLinks = await this.generatePartnerLinks(filmData.title, filmData.year, contentType);
          
          const newFilm = {
            title: fullData.name || filmData.title,
            year: parseInt(fullData.year || filmData.year),
            rating: parseFloat(fullData.rating?.kp || filmData.rating) || 7.0,
            genre: fullData.genres?.[0]?.name || filmData.genre,
            duration: fullData.movieLength ? `${fullData.movieLength} мин` : filmData.duration,
            country: fullData.countries?.[0]?.name || filmData.country,
            img: fullData.poster?.url || filmData.img || this.generatePlaceholder(filmData.title),
            description: fullData.description || filmData.description,
            director: this.extractDirector(fullData) || filmData.director,
            actors: this.extractActors(fullData) || filmData.actors,
            contentType: contentType,
            seasons: fullData.seasonsInfo?.length || 1,
            partnerLinks: partnerLinks,
            tags: [fullData.genres?.[0]?.name || filmData.genre],
            kpId: fullData.id || filmData.kpId,
            backdropUrl: fullData.backdrop?.url || null,
            ageRating: fullData.ageRating || filmData.ageRating || '16+',
            trailerUrl: fullData.trailer?.url || null
          };
          
          const savedFilm = await this.saveFilmToAPI(newFilm);
          return savedFilm;
        }
      }
      
      return await this.alternativeSearch(movieTitle, year, contentType);
    } catch (error) {
      console.error("Ошибка автодобавления:", error);
      return await this.alternativeSearch(movieTitle, year, contentType);
    }
  }
  
  async alternativeSearch(title, year, contentType) {
    const partnerLinks = await this.generatePartnerLinks(title, year, contentType);
    
    const newFilm = {
      title: title,
      year: parseInt(year) || new Date().getFullYear(),
      rating: 7.5,
      genre: this.getGenreByContentType(contentType),
      duration: contentType === "movie" ? "120 мин" : "45 мин",
      country: "Россия",
      img: this.generatePlaceholder(title),
      description: `${title} - ${this.getContentTypeDescription(contentType)}`,
      director: "Не указан",
      actors: "Не указан",
      contentType: contentType,
      partnerLinks: partnerLinks,
      tags: [this.getGenreByContentType(contentType)],
      ageRating: '16+'
    };
    
    try {
      const savedFilm = await this.saveFilmToAPI(newFilm);
      if (savedFilm) return savedFilm;
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      throw error;
    }
  }
  
  async updateFilmFull(filmId, filmData) {
    try {
      const success = await this.updateFilmInAPI(filmId, filmData);
      
      if (success) {
        const filmIndex = this.films.findIndex(f => f.id == filmId);
        if (filmIndex !== -1) {
          this.films[filmIndex] = { ...this.films[filmIndex], ...filmData };
          localStorage.setItem('vzorkino_films_cache', JSON.stringify(this.films));
        }
        return this.films[filmIndex];
      }
      return null;
    } catch (error) {
      console.error('Ошибка обновления фильма:', error);
      throw error;
    }
  }
  
  getFilmById(filmId) {
    return this.films.find(f => f.id == filmId) || null;
  }
  
  generatePlaceholder(title) {
    const colors = ['#1a1a24', '#2a2a3a', '#3a3a4a', '#4a4a5a'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const svg = `
      <svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${color}"/>
        <rect x="20%" y="40%" width="60%" height="20%" fill="${this.darkenColor(color, 0.2)}" rx="5" ry="5"/>
      </svg>
    `;
    
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }
  
  darkenColor(color, amount) {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const amt = Math.round(2.55 * amount * 100);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (
      0x1000000 +
      (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
  }
  
  async generatePartnerLinks(title, year, contentType) {
    const encodedTitle = encodeURIComponent(title);
    
    return {
      okko: `https://okko.tv/search/${encodedTitle}`,
      ivi: `https://www.ivi.ru/search/?q=${encodedTitle}`,
      wink: `https://wink.ru/search?query=${encodedTitle}`,
      kion: `https://kion.ru/search?query=${encodedTitle}`,
      premier: `https://premier.one/search?q=${encodedTitle}`,
      kinopoisk: `https://www.kinopoisk.ru/index.php?kp_query=${encodedTitle}`
    };
  }
  
  formatPoiskKinoData(movieData, contentType) {
    let posterPath = null;
    if (movieData.poster) {
      posterPath = movieData.poster.previewUrl || movieData.poster.url;
    }
    
    let rating = 7.0;
    if (movieData.rating) {
      rating = movieData.rating.kp || movieData.rating.imdb || movieData.rating.tmdb || 7.0;
      if (rating > 10) rating = rating / 10;
    }
    
    let genre = 'Фильм';
    if (movieData.genres && movieData.genres.length > 0) {
      genre = movieData.genres.map(g => g.name).join(', ');
    } else {
      genre = this.getGenreByContentType(contentType);
    }
    
    let country = 'Россия';
    if (movieData.countries && movieData.countries.length > 0) {
      country = movieData.countries.map(c => c.name).join(', ');
    }
    
    let description = movieData.description || movieData.shortDescription;
    if (!description) {
      description = `"${movieData.name || movieData.alternativeName}" - ${this.getContentTypeDescription(contentType)}`;
    }
    
    let duration = '120 мин';
    if (movieData.movieLength) {
      duration = `${movieData.movieLength} мин`;
    } else if (contentType === 'series') {
      duration = '45 мин серия';
    }
    
    let seasons = 1;
    if (contentType === 'series' && movieData.seasonsInfo) {
      seasons = movieData.seasonsInfo.length;
    }
    
    let ageRating = '16+';
    if (movieData.ageRating) {
      ageRating = movieData.ageRating;
    }
    
    return {
      title: movieData.name || movieData.alternativeName || 'Без названия',
      year: movieData.year || new Date().getFullYear(),
      rating: parseFloat(rating.toFixed(1)),
      description: description,
      img: posterPath,
      genre: genre,
      country: country,
      director: this.extractDirector(movieData),
      actors: this.extractActors(movieData),
      kpId: movieData.id,
      contentType: contentType,
      seasons: seasons,
      duration: duration,
      ageRating: ageRating
    };
  }
  
  extractDirector(movieData) {
    if (movieData.persons && Array.isArray(movieData.persons)) {
      const directors = movieData.persons.filter(person => {
        const profession = (person.enProfession || person.profession || '').toLowerCase();
        return profession.includes('director') || profession.includes('режиссер');
      });
      
      if (directors.length > 0) {
        return directors.slice(0, 2).map(d => d.name || d.enName).filter(Boolean).join(', ');
      }
    }
    return 'Не указан';
  }
  
  extractActors(movieData) {
    if (movieData.persons && Array.isArray(movieData.persons)) {
      const actors = movieData.persons.filter(person => {
        const profession = (person.enProfession || person.profession || '').toLowerCase();
        return profession.includes('actor') || profession.includes('актер');
      });
      
      if (actors.length > 0) {
        return actors.slice(0, 6).map(a => a.name || a.enName).filter(Boolean).join(', ');
      }
    }
    return 'Не указаны';
  }
  
  getGenreByContentType(contentType) {
    switch(contentType) {
      case "series": return "Сериал";
      case "cartoon": return "Мультфильм";
      default: return "Фильм";
    }
  }
  
  getContentTypeDescription(contentType) {
    switch(contentType) {
      case "series": return "сериал";
      case "cartoon": return "мультфильм";
      default: return "фильм";
    }
  }
  
  normalizeFilmData(film) {
    return {
      id: film.id,
      title: film.title,
      year: film.year,
      rating: film.rating,
      genre: film.genre,
      duration: film.duration,
      country: film.country,
      partner: film.partner,
      img: film.img || this.generatePlaceholder(film.title),
      description: film.description,
      director: film.director,
      actors: film.actors,
      reviews: film.reviews || [],
      tags: film.tags || [],
      userRatings: film.user_ratings || [],
      contentType: film.content_type || 'movie',
      seasons: film.seasons || 1,
      partnerLinks: film.partner_data || {},
      kpId: film.kp_id,
      createdAt: film.created_at,
      updatedAt: film.updated_at,
      backdropUrl: film.backdrop_url,
      ageRating: film.age_rating || '16+',
      trailerUrl: film.trailer_url
    };
  }
  
  preloadImages() {
    if (!this.films || this.films.length === 0) return;
    
    this.films.forEach(film => {
      if (film.img && !film.img.includes('data:image/svg+xml')) {
        const img = new Image();
        img.src = film.img;
      } else if (!film.img) {
        film.img = this.generatePlaceholder(film.title);
      }
    });
  }
  
  async bulkAddFilms(filmList) {
    const results = [];
    for (const film of filmList) {
      const result = await this.autoAddFilm(film.title, film.year, film.contentType);
      results.push(result);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return results;
  }
  
  async addUserRating(filmId, rating, userId = "defaultUser") {
    const filmIndex = this.films.findIndex(film => film.id == filmId);
    if (filmIndex !== -1) {
      if (!this.films[filmIndex].userRatings) {
        this.films[filmIndex].userRatings = [];
      }
      
      this.films[filmIndex].userRatings = this.films[filmIndex].userRatings.filter(
        r => r.userId !== userId
      );
      
      this.films[filmIndex].userRatings.push({
        userId: userId,
        rating: rating,
        date: new Date().toISOString()
      });
      
      await this.updateFilmInAPI(filmId, {
        user_ratings: this.films[filmIndex].userRatings
      });
      
      localStorage.setItem('vzorkino_films_cache', JSON.stringify(this.films));
      
      return rating;
    }
    return null;
  }
  
  async addReview(filmId, reviewData) {
    const filmIndex = this.films.findIndex(film => film.id == filmId);
    if (filmIndex !== -1) {
      if (!this.films[filmIndex].reviews) {
        this.films[filmIndex].reviews = [];
      }
      
      const newReview = {
        id: Date.now(),
        text: reviewData.text,
        rating: reviewData.rating,
        date: new Date().toISOString(),
        author: reviewData.author || "Аноним",
        userId: reviewData.userId || null
      };
      
      this.films[filmIndex].reviews.unshift(newReview);
      
      await this.updateFilmInAPI(filmId, {
        reviews: this.films[filmIndex].reviews
      });
      
      localStorage.setItem('vzorkino_films_cache', JSON.stringify(this.films));
      
      return newReview;
    }
    return null;
  }
  
  getUserRating(filmId, userId = "defaultUser") {
    const film = this.films.find(f => f.id == filmId);
    if (film && film.userRatings) {
      const userRating = film.userRatings.find(r => r.userId === userId);
      return userRating ? userRating.rating : 0;
    }
    return 0;
  }
  
  getAverageUserRating(filmId) {
    const film = this.films.find(f => f.id == filmId);
    if (film && film.userRatings && film.userRatings.length > 0) {
      const sum = film.userRatings.reduce((total, r) => total + r.rating, 0);
      return (sum / film.userRatings.length).toFixed(1);
    }
    return "0.0";
  }
  
  updateFilm(filmId, updatedData) {
    const filmIndex = this.films.findIndex(film => film.id == filmId);
    if (filmIndex !== -1) {
      this.films[filmIndex] = { ...this.films[filmIndex], ...updatedData };
      localStorage.setItem('vzorkino_films_cache', JSON.stringify(this.films));
      return true;
    }
    return false;
  }
  
  getFilmsByContentType(contentType) {
    return this.films.filter(film => film.contentType === contentType);
  }
  
  getPopularFilms(limit = 20) {
    return [...this.films]
      .sort((a, b) => {
        const aScore = (a.rating || 0) + (a.reviews ? a.reviews.length * 0.1 : 0);
        const bScore = (b.rating || 0) + (b.reviews ? b.reviews.length * 0.1 : 0);
        return bScore - aScore;
      })
      .slice(0, limit);
  }
  
  getNewReleases(limit = 15) {
    const currentYear = new Date().getFullYear();
    return [...this.films]
      .filter(film => film.year >= currentYear - 1)
      .sort((a, b) => b.year - a.year)
      .slice(0, limit);
  }
  
  searchFilms(query) {
    const searchTerm = query.toLowerCase();
    return this.films.filter(film => 
      film.title.toLowerCase().includes(searchTerm) ||
      (film.description && film.description.toLowerCase().includes(searchTerm)) ||
      film.genre.toLowerCase().includes(searchTerm)
    );
  }
}

export const filmManager = new FilmManager();
export default FilmManager;