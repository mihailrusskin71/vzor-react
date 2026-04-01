import { PARTNERS } from '../utils/constants';

class FilmManager {
  constructor() {
    this.SUPABASE_URL = 'https://qolbgrvlkadqnfnprbgr.supabase.co';
    this.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbGJncnZsa2FkcW5mbnByYmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NzUwMTAsImV4cCI6MjA3ODU1MTAxMH0.XYg5fhJ7ve_UVhAg_fzk4oJFEpje6zb4To-7DIhDgws';
    this.POISK_KINO_API_KEY = "QHABHFK-P68MM3H-GQFQB7D-1VRGXYQ";
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
          console.log(`Фильмов в кэше: ${this.films.length}`);
        }
      }
      
      const cachedRows = localStorage.getItem('vzorkino_custom_rows');
      if (cachedRows) {
        this.customRows = JSON.parse(cachedRows);
        if (Object.keys(this.customRows).length > 0) {
          console.log(`Рядов в кэше: ${Object.keys(this.customRows).length}`);
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
        this.loadFilmsFromSupabase(),
        this.loadCustomRowsFromSupabase()
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
  
  async loadFilmsFromSupabase() {
    try {
      const response = await fetch(`${this.SUPABASE_URL}/rest/v1/films?select=*&order=created_at.desc`, {
        headers: {
          'apikey': this.SUPABASE_KEY,
          'Authorization': `Bearer ${this.SUPABASE_KEY}`
        }
      });
      
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
  
  async loadCustomRowsFromSupabase() {
    try {
      const response = await fetch(`${this.SUPABASE_URL}/rest/v1/custom_rows?select=*&order=created_at.desc`, {
        headers: {
          'apikey': this.SUPABASE_KEY,
          'Authorization': `Bearer ${this.SUPABASE_KEY}`
        }
      });
      
      if (response.ok) {
        const rows = await response.json();
        const supabaseRows = {};
        
        rows.forEach(row => {
          supabaseRows[row.id] = {
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
        
        return supabaseRows;
      }
    } catch (error) {
      console.error('Ошибка загрузки рядов:', error);
      return this.customRows;
    }
  }
  
  syncCustomRows(supabaseRows) {
    const mergedRows = { ...this.customRows };
    
    Object.keys(supabaseRows).forEach(rowId => {
      if (!mergedRows[rowId]) {
        mergedRows[rowId] = supabaseRows[rowId];
      } else {
        const localRow = mergedRows[rowId];
        const supabaseRow = supabaseRows[rowId];
        
        if (supabaseRow.updatedAt > localRow.updatedAt) {
          mergedRows[rowId] = supabaseRow;
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
      const success = await this.saveCustomRowToSupabase(newRow);
      if (success) {
        console.log('Ряд синхронизирован с Supabase');
      }
    }, 50);
    
    return newRow;
  }
  
  async saveCustomRowToSupabase(rowData) {
    try {
      const response = await fetch(`${this.SUPABASE_URL}/rest/v1/custom_rows`, {
        method: 'POST',
        headers: {
          'apikey': this.SUPABASE_KEY,
          'Authorization': `Bearer ${this.SUPABASE_KEY}`,
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
      
      if (response.ok) {
        const result = await response.json();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Ошибка сохранения ряда:', error);
      return false;
    }
  }
  
  async updateCustomRowInSupabase(rowId, updates) {
    try {
      const supabaseUpdates = {};
      
      if (updates.rowItems !== undefined) supabaseUpdates.row_items = updates.rowItems;
      if (updates.modalItems !== undefined) supabaseUpdates.modal_items = updates.modalItems;
      if (updates.name !== undefined) supabaseUpdates.name = updates.name;
      if (updates.pageType !== undefined) supabaseUpdates.page_type = updates.pageType;
      if (updates.maxRowItems !== undefined) supabaseUpdates.max_row_items = updates.maxRowItems;
      
      supabaseUpdates.updated_at = new Date().toISOString();
      
      const response = await fetch(`${this.SUPABASE_URL}/rest/v1/custom_rows?id=eq.${rowId}`, {
        method: 'PATCH',
        headers: {
          'apikey': this.SUPABASE_KEY,
          'Authorization': `Bearer ${this.SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(supabaseUpdates)
      });
      
      return response.ok;
    } catch (error) {
      console.error('Ошибка обновления ряда:', error);
      return false;
    }
  }
  
  async deleteCustomRowFromSupabase(rowId) {
    try {
      const response = await fetch(`${this.SUPABASE_URL}/rest/v1/custom_rows?id=eq.${rowId}`, {
        method: 'DELETE',
        headers: {
          'apikey': this.SUPABASE_KEY,
          'Authorization': `Bearer ${this.SUPABASE_KEY}`
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Ошибка удаления ряда:', error);
      return false;
    }
  }
  
  deleteCustomRow(rowId) {
    if (this.customRows[rowId]) {
      delete this.customRows[rowId];
      this.saveCustomRowsToLocal();
      
      setTimeout(async () => {
        const success = await this.deleteCustomRowFromSupabase(rowId);
        if (success) {
          console.log('Ряд удален из Supabase');
        }
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
        await this.updateCustomRowInSupabase(rowId, {
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
      await this.updateCustomRowInSupabase(rowId, {
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
        await this.updateCustomRowInSupabase(rowId, {
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
      await this.updateCustomRowInSupabase(rowId, {
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
  
  preloadImages() {
    if (!this.films || this.films.length === 0) return;
    
    this.films.forEach(film => {
      if (film.img && !film.img.includes('data:image/svg+xml')) {
        const img = new Image();
        img.src = film.img;
        img.onerror = () => {
          film.img = this.generatePlaceholder(film.title);
        };
      } else if (!film.img) {
        film.img = this.generatePlaceholder(film.title);
      }
    });
  }
  
  normalizeFilmData(film) {
    const normalizedFilm = {
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
      reviews: film.reviews || film.user_ratings || [],
      tags: film.tags || [],
      userRatings: film.user_ratings || [],
      contentType: film.content_type || 'movie',
      seasons: film.seasons || 1,
      episodes: film.episodes || 1,
      partnerLinks: film.partner_data || {},
      kpId: film.kp_id,
      createdAt: film.created_at,
      updatedAt: film.updated_at,
      featuredRows: film.featured_data || [],
      logoUrl: film.logo_url || null,
      backdropUrl: film.backdrop_url || null,
      ageRating: film.age_rating || '16+',
      trailerUrl: film.trailer_url || null
    };
    
    if (!normalizedFilm.img || normalizedFilm.img.includes('placeholder.com') || normalizedFilm.img.includes('ffffff')) {
      normalizedFilm.img = this.generatePlaceholder(normalizedFilm.title);
    }
    
    return normalizedFilm;
  }
  
  async saveFilmToSupabase(film) {
    try {
      const filmData = {
        title: film.title || '',
        year: film.year || new Date().getFullYear(),
        rating: film.rating || 7.0,
        genre: film.genre || 'Фильм',
        duration: film.duration || '120 мин',
        country: film.country || 'Россия',
        partner: film.partner || 'okko',
        img: film.img || this.generatePlaceholder(film.title),
        description: film.description || `Фильм "${film.title}"`,
        director: film.director || 'Режиссер',
        actors: film.actors || 'Актеры',
        content_type: film.contentType || 'movie',
        seasons: film.seasons || 1,
        kp_id: film.kpId || null,
        featured_data: film.featuredRows || [],
        partner_data: film.partnerLinks || {},
        tags: film.tags || [],
        reviews: film.reviews || [],
        user_ratings: film.userRatings || [],
        logo_url: film.logoUrl || null,
        backdrop_url: film.backdropUrl || null,
        age_rating: film.ageRating || '16+',
        trailer_url: film.trailerUrl || null
      };
      
      const response = await fetch(`${this.SUPABASE_URL}/rest/v1/films`, {
        method: 'POST',
        headers: {
          'apikey': this.SUPABASE_KEY,
          'Authorization': `Bearer ${this.SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(filmData)
      });
      
      if (response.ok) {
        const result = await response.json();
        const normalizedFilm = this.normalizeFilmData(result[0]);
        
        this.films.unshift(normalizedFilm);
        localStorage.setItem('vzorkino_films_cache', JSON.stringify(this.films));
        
        return normalizedFilm;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Ошибка сохранения фильма:', error);
      throw error;
    }
  }
  
  async deleteFilm(filmId) {
    try {
      await this.removeFilmFromAllRows(filmId);
      
      this.films = this.films.filter(film => film.id != filmId);
      localStorage.setItem('vzorkino_films_cache', JSON.stringify(this.films));
      
      setTimeout(async () => {
        const response = await fetch(`${this.SUPABASE_URL}/rest/v1/films?id=eq.${filmId}`, {
          method: 'DELETE',
          headers: {
            'apikey': this.SUPABASE_KEY,
            'Authorization': `Bearer ${this.SUPABASE_KEY}`
          }
        });
        
        if (response.ok) {
          console.log('Фильм удален из базы');
        }
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
          await this.updateCustomRowInSupabase(rowId, {
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
          row.rowItems = row.rowItems.filter(filmId => 
            filmIds.includes(filmId.toString())
          );
          cleanedCount += (originalLength - row.rowItems.length);
        }
        
        if (row.modalItems && row.modalItems.length > 0) {
          const originalLength = row.modalItems.length;
          row.modalItems = row.modalItems.filter(filmId => 
            filmIds.includes(filmId.toString())
          );
          cleanedCount += (originalLength - row.modalItems.length);
        }
        
        this.customRows[rowId] = row;
        
        setTimeout(async () => {
          await this.updateCustomRowInSupabase(rowId, {
            rowItems: row.rowItems,
            modalItems: row.modalItems
          });
        }, 50);
      });
      
      if (cleanedCount > 0) {
        console.log(`Очищено ${cleanedCount} ссылок на несуществующие фильмы`);
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
      logoUrl: null,
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
            ...this.getTemplate(),
            title: fullData.name || filmData.title,
            year: fullData.year || filmData.year,
            rating: fullData.rating?.kp || filmData.rating,
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
            logoUrl: fullData.logo?.url || null,
            backdropUrl: fullData.backdrop?.url || null,
            ageRating: fullData.ageRating || filmData.ageRating || '16+',
            trailerUrl: fullData.trailer?.url || null
          };
          
          const savedFilm = await this.saveFilmToSupabase(newFilm);
          return savedFilm;
        }
      }
      
      return await this.alternativeSearch(movieTitle, year, contentType);
    } catch (error) {
      console.error("Ошибка автодобавления:", error);
      return await this.alternativeSearch(movieTitle, year, contentType);
    }
  }
  
  async updateFilmFull(filmId, filmData) {
    try {
      const response = await fetch(`${this.SUPABASE_URL}/rest/v1/films?id=eq.${filmId}`, {
        method: 'PATCH',
        headers: {
          'apikey': this.SUPABASE_KEY,
          'Authorization': `Bearer ${this.SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          ...filmData,
          updated_at: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result && result.length > 0) {
          const updatedFilm = this.normalizeFilmData(result[0]);
          
          const filmIndex = this.films.findIndex(f => f.id == filmId);
          if (filmIndex !== -1) {
            this.films[filmIndex] = updatedFilm;
            localStorage.setItem('vzorkino_films_cache', JSON.stringify(this.films));
          }
          
          return updatedFilm;
        }
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
  
  async searchPoiskKino(title, year = null, contentType = "movie") {
    try {
      const typeMap = {
        'movie': 'movie',
        'series': 'tv-series',
        'cartoon': 'animated-series'
      };
      
      const apiType = typeMap[contentType] || 'movie';
      
      let searchUrl = `https://api.poiskkino.dev/v1.4/movie/search?query=${encodeURIComponent(title)}&limit=5`;
      if (year) searchUrl += `&year=${year}`;
      
      const searchResponse = await fetch(searchUrl, {
        headers: { 'X-API-KEY': this.POISK_KINO_API_KEY }
      });
      
      if (!searchResponse.ok) throw new Error(`HTTP error! status: ${searchResponse.status}`);
      
      const searchData = await searchResponse.json();
      
      if (searchData.docs && searchData.docs.length > 0) {
        let bestMatch = searchData.docs[0];
        
        const typeMatches = searchData.docs.filter(movie => movie.type === apiType);
        if (typeMatches.length > 0) {
          bestMatch = typeMatches[0];
        }
        
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
      const response = await fetch(`https://api.poiskkino.dev/v1.4/movie/${movieId}`, {
        headers: { 'X-API-KEY': this.POISK_KINO_API_KEY }
      });
      
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
  
  formatPoiskKinoData(movieData, contentType) {
    let posterPath = null;
    if (movieData.poster) {
      posterPath = movieData.poster.previewUrl || movieData.poster.url;
    }
    
    let backdropPath = null;
    if (movieData.backdrop) {
      backdropPath = movieData.backdrop.previewUrl || movieData.backdrop.url;
    }
    
    let logoPath = null;
    if (movieData.logo) {
      logoPath = movieData.logo.previewUrl || movieData.logo.url;
    }
    
    let rating = 7.0;
    if (movieData.rating) {
      rating = movieData.rating.kp || movieData.rating.imdb || movieData.rating.tmdb || 7.0;
      if (rating > 10) rating = rating / 10;
    }
    
    let genre = 'Фильм';
    if (movieData.genres && movieData.genres.length > 0) {
      genre = movieData.genres.map(g => g.name).join(', ');
    } else if (movieData.genre && movieData.genre.length > 0) {
      genre = movieData.genre.map(g => g.name).join(', ');
    } else {
      genre = this.getGenreByContentType(contentType);
    }
    
    let country = 'Россия';
    if (movieData.countries && movieData.countries.length > 0) {
      country = movieData.countries.map(c => c.name).join(', ');
    } else if (movieData.country && movieData.country.length > 0) {
      country = movieData.country.map(c => c.name).join(', ');
    }
    
    let description = movieData.description || movieData.shortDescription || movieData.overview;
    if (!description) {
      description = `"${movieData.name || movieData.alternativeName}" - ${this.getContentTypeDescription(contentType)}`;
    }
    
    let duration = '120 мин';
    if (movieData.movieLength) {
      duration = `${movieData.movieLength} мин`;
    } else if (movieData.runtime) {
      duration = `${movieData.runtime} мин`;
    } else if (contentType === 'series') {
      duration = '45 мин серия';
    } else if (contentType === 'cartoon') {
      duration = '90 мин';
    }
    
    let seasons = 1;
    if (contentType === 'series') {
      if (movieData.seasonsInfo && Array.isArray(movieData.seasonsInfo)) {
        seasons = movieData.seasonsInfo.length;
      } else if (movieData.numberOfSeasons) {
        seasons = movieData.numberOfSeasons;
      } else if (movieData.totalSeasons) {
        seasons = movieData.totalSeasons;
      }
    }
    
    let ageRating = '16+';
    if (movieData.ageRating) {
      ageRating = movieData.ageRating;
    } else if (movieData.adult === false) {
      ageRating = '12+';
    } else if (movieData.adult === true) {
      ageRating = '18+';
    }
    
    return {
      title: movieData.name || movieData.alternativeName || movieData.title || 'Без названия',
      originalTitle: movieData.alternativeName || movieData.enName || movieData.originalTitle || '',
      year: movieData.year || movieData.releaseDate?.substring(0, 4) || new Date().getFullYear(),
      rating: parseFloat(rating.toFixed(1)),
      description: description,
      img: posterPath,
      genre: genre,
      country: country,
      director: this.extractDirector(movieData),
      actors: this.extractActors(movieData),
      kpId: movieData.id || movieData.kpId,
      contentType: contentType,
      seasons: seasons,
      duration: duration,
      logoUrl: logoPath,
      backdropUrl: backdropPath,
      ageRating: ageRating,
      trailerUrl: movieData.trailer?.url || null
    };
  }
  
  extractDirector(movieData) {
    if (movieData.persons && Array.isArray(movieData.persons)) {
      const directors = movieData.persons.filter(person => {
        const enProfession = person.enProfession ? person.enProfession.toLowerCase() : '';
        const profession = person.profession ? person.profession.toLowerCase() : '';
        
        return enProfession.includes('director') || 
               profession.includes('режиссер') ||
               enProfession.includes('producer') ||
               profession.includes('продюсер');
      });
      
      if (directors.length > 0) {
        const directorNames = directors.slice(0, 2).map(d => {
          return d.name || d.enName || '';
        }).filter(Boolean);
        
        if (directorNames.length > 0) {
          return directorNames.join(', ');
        }
      }
    }
    
    return 'Не указан';
  }
  
  extractActors(movieData) {
    const actors = [];
    
    if (movieData.persons && Array.isArray(movieData.persons)) {
      const actorPersons = movieData.persons.filter(person => {
        const enProfession = person.enProfession ? person.enProfession.toLowerCase() : '';
        const profession = person.profession ? person.profession.toLowerCase() : '';
        
        return enProfession.includes('actor') || 
               enProfession.includes('actress') ||
               profession.includes('актер') ||
               profession.includes('актриса');
      });
      
      const actorNames = actorPersons.slice(0, 6).map(a => {
        return a.name || a.enName || '';
      }).filter(Boolean);
      
      actors.push(...actorNames);
    }
    
    if (actors.length > 0) {
      return actors.join(', ');
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
  
  async alternativeSearch(title, year, contentType) {
    const partnerLinks = await this.generatePartnerLinks(title, year, contentType);
    
    const newFilm = {
      ...this.getTemplate(),
      title: title,
      year: year || new Date().getFullYear(),
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
      tags: [this.getGenreByContentType(contentType)]
    };
    
    try {
      const savedFilm = await this.saveFilmToSupabase(newFilm);
      if (savedFilm) {
        return savedFilm;
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      throw error;
    }
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
      
      await this.updateFilmInSupabase(filmId, {
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
      
      await this.updateFilmInSupabase(filmId, {
        reviews: this.films[filmIndex].reviews
      });
      
      localStorage.setItem('vzorkino_films_cache', JSON.stringify(this.films));
      
      return newReview;
    }
    return null;
  }
  
  async updateFilmInSupabase(filmId, updates) {
    try {
      const supabaseUpdates = {};
      Object.keys(updates).forEach(key => {
        if (key === 'contentType') supabaseUpdates.content_type = updates[key];
        else if (key === 'partnerLinks') supabaseUpdates.partner_data = updates[key];
        else if (key === 'userRatings') supabaseUpdates.user_ratings = updates[key];
        else if (key === 'featuredRows') supabaseUpdates.featured_data = updates[key];
        else if (key === 'ageRating') supabaseUpdates.age_rating = updates[key];
        else if (key === 'trailerUrl') supabaseUpdates.trailer_url = updates[key];
        else supabaseUpdates[key] = updates[key];
      });
      
      const response = await fetch(`${this.SUPABASE_URL}/rest/v1/films?id=eq.${filmId}`, {
        method: 'PATCH',
        headers: {
          'apikey': this.SUPABASE_KEY,
          'Authorization': `Bearer ${this.SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...supabaseUpdates,
          updated_at: new Date().toISOString()
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Ошибка обновления:', error);
      return false;
    }
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