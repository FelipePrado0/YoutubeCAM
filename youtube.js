// ==UserScript==
// @name         Buscar Músicas e Playlists no YouTube (Krolik)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Busca músicas no YouTube e exibe em uma barra lateral.
// @author       Felipe Prado
// @match        https://app.camkrolik.com.br/*
// @match        https://is.xivup.com/*
// @connect      googleapis.com
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // =================================================================================
    // CONFIGURAÇÃO
    // =================================================================================
    const YOUTUBE_API_KEY = 'AIzaSyA47h6TUyA6tTDZrAEldUQgROnWMcee9Ww';
    const BARRA_LATERAL_LARGURA = 60;
    const LARGURA_ABA_YOUTUBE = 350;
    const ALTURA_PLAYER_FIXO = 197;
    const ALTURA_PLAYER_PLAYLIST = 200;

    // =================================================================================
    // VARIÁVEIS GLOBAIS
    // =================================================================================
    let ultimoTermo = '';
    let ultimoTipo = 'video';
    let ultimosResultados = null;
    let playerContainer = null;
    let painel = null;

    // =================================================================================
    // FUNÇÕES UTILITÁRIAS
    // =================================================================================
    
    function extrairIdPlaylist(url) {
        const patterns = [
            /(?:youtube\.com\/playlist\?list=|youtube\.com\/watch\?.*list=)([a-zA-Z0-9_-]+)/,
            /(?:youtube\.com\/playlist\?list=)([a-zA-Z0-9_-]+)/,
            /(?:youtube\.com\/watch\?.*&list=)([a-zA-Z0-9_-]+)/,
            /(?:youtube\.com\/watch\?list=)([a-zA-Z0-9_-]+)/
        ];
        
        for (let pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    function extrairIdVideo(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/,
            /(?:youtu\.be\/)([a-zA-Z0-9_-]+)/,
            /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
            /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]+)/,
            /(?:youtube\.com\/watch\?.*&v=)([a-zA-Z0-9_-]+)/,
            /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)(?:&.*)?/
        ];
        
        for (let pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    function criarUrlEmbed(videoId, playlistId = null) {
        const params = new URLSearchParams({
            autoplay: '1',
            controls: '1',
            modestbranding: '1',
            rel: '0',
            showinfo: '0'
        });
        
        if (playlistId) {
            params.set('list', playlistId);
        }
        
        return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    }

    // =================================================================================
    // ANIMAÇÕES
    // =================================================================================
    
    function mostrarPainelComAnimacao() {
        painel.style.display = 'flex';
        setTimeout(() => {
            painel.style.opacity = '1';
            painel.style.transform = 'translateX(0)';
        }, 10);
    }

    function ocultarPainelComAnimacao() {
        painel.style.opacity = '0';
        painel.style.transform = 'translateX(30px)';
        setTimeout(() => painel.style.display = 'none', 300);
    }

    function mostrarPlayerComAnimacao() {
        playerContainer.style.display = 'flex';
        setTimeout(() => {
            playerContainer.style.opacity = '1';
            playerContainer.style.transform = 'translateY(0)';
        }, 10);
    }

    function ocultarPlayerComAnimacao() {
        playerContainer.style.opacity = '0';
        playerContainer.style.transform = 'translateY(-20px)';
        setTimeout(() => playerContainer.style.display = 'none', 300);
    }

    function mostrarSpinner() {
        const resultsDiv = painel.querySelector('.yt-dark-results');
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 100px;">
                    <div style="width: 40px; height: 40px; border: 3px solid #333; border-top: 3px solid #ff0000; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                </div>
            `;
        }
    }

    // =================================================================================
    // CRIAÇÃO DE ELEMENTOS
    // =================================================================================
    
    function criarPlayerContainer() {
        if (!playerContainer) {
            playerContainer = document.createElement('div');
            playerContainer.id = 'yt-player-fixed';
            playerContainer.style.cssText = `
                position: fixed;
                top: 0; right: ${BARRA_LATERAL_LARGURA}px; z-index: 100000;
                width: ${LARGURA_ABA_YOUTUBE}px; height: ${ALTURA_PLAYER_FIXO}px;
                background: #000;
                display: none;
                justify-content: center;
                align-items: center;
                box-shadow: -2px 0 12px #0002;
                transition: opacity 0.3s ease, transform 0.3s ease;
                opacity: 0;
                transform: translateY(-20px);
            `;
            document.body.appendChild(playerContainer);
        }
    }

    function criarPainel() {
        if (!painel) {
            painel = document.createElement('div');
            painel.id = 'painel-youtube';
            painel.style.cssText = `
                position: fixed;
                top: 0;
                right: ${BARRA_LATERAL_LARGURA}px;
                height: 100vh;
                width: ${LARGURA_ABA_YOUTUBE}px;
                z-index: 99999;
                background: #fff;
                box-shadow: -2px 0 12px #0002;
                display: none;
                flex-direction: column;
                overflow-y: auto;
                border-left: 1px solid #eee;
                transition: top 0.3s ease, opacity 0.3s ease, transform 0.3s ease;
                opacity: 0;
                transform: translateX(30px);
            `;
            document.body.appendChild(painel);
        }
    }

    function criarBotao() {
        const containerDoBotao = document.createElement('div');
        containerDoBotao.id = 'meu-botao-youtube';
        containerDoBotao.className = 'jss316 primary-color';
        containerDoBotao.style.cssText = 'visibility: visible; opacity: 1; transform-origin: 50% 50% 0px; transform: scaleX(1) scaleY(1);';
        
        const meuBotao = document.createElement('button');
        meuBotao.className = 'MuiButtonBase-root MuiIconButton-root MuiIconButton-colorInherit';
        meuBotao.type = 'button';
        meuBotao.title = 'Buscar músicas no YouTube';
        meuBotao.innerHTML = `<span class="MuiIconButton-label"><img src="https://toppng.com/uploads/preview/umbrella-corp-logo-115629074748jwup5drlq.png" style="width: 35px; height: 35px; border-radius: 6px;" alt="Logo YouTube"></span>`;

        meuBotao.addEventListener('click', alternarPainel);
        
        containerDoBotao.appendChild(meuBotao);
        return containerDoBotao;
    }

    // =================================================================================
    // RENDERIZAÇÃO
    // =================================================================================
    
    function renderPainel(termoBusca = '', tipoBusca = 'video', resultados = null, erro = null) {
        painel.innerHTML = `
            <div class="yt-dark-header">
                <span class="yt-dark-title">YouTube</span>
                <button id="fechar-painel-youtube" class="yt-dark-close">&times;</button>
            </div>
            <form class="yt-dark-search" id="yt-form">
                <div class="yt-dark-search-box">
                    <input type="text" id="yt-termo" placeholder="Pesquisar ou colar link do YouTube" value="${termoBusca.replace(/"/g, '&quot;')}" required>
                    <select id="yt-tipo">
                        <option value="video" ${tipoBusca === 'video' ? 'selected' : ''}>Vídeo</option>
                        <option value="playlist" ${tipoBusca === 'playlist' ? 'selected' : ''}>Playlist</option>
                    </select>
                    <button type="submit" class="yt-dark-search-btn" title="Buscar">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="9" cy="9" r="7" stroke="#fff" stroke-width="2"/>
                            <line x1="14.2929" y1="14.7071" x2="18" y2="18.4142" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            </form>
            <div id="yt-link-indicator" class="yt-link-indicator" style="display: none;">
                <span id="yt-link-text">Detectando tipo de link...</span>
            </div>
            ${erro ? `<div class="yt-dark-erro">${erro}</div>` : ''}
            <div class="yt-dark-results">
                ${renderizarResultados(resultados, tipoBusca)}
            </div>
        `;

        configurarEventosPainel();
    }

    function renderizarResultados(resultados, tipoBusca) {
        if (!resultados) return '';
        
        if (resultados.length === 0) {
            return '<div class="yt-dark-nada">Nenhum resultado encontrado.</div>';
        }

        return resultados.map(item => {
            const isVideo = tipoBusca === 'video';
            const videoId = isVideo ? item.id.videoId : item.id.playlistId;
            const thumb = item.snippet.thumbnails.high.url;
            const title = item.snippet.title;
            const channel = item.snippet.channelTitle;

            return `
                <div class="yt-dark-card" data-videoid="${videoId}" data-isvideo="${isVideo}">
                    <img class="yt-dark-thumb" src="${thumb}" alt="">
                    <div class="yt-dark-info">
                        <div class="yt-dark-title">${title}</div>
                        <div class="yt-dark-channel">${channel}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderPainelPlaylist(itens, playlistId, videoIdAtual) {
        const currentVideoId = videoIdAtual || (itens[0] ? itens[0].snippet.resourceId.videoId : null);

        painel.innerHTML = `
            <div class="yt-dark-playlist-header">
                <div class="yt-dark-playlist-player">
                    <iframe width="100%" height="100%" src="${criarUrlEmbed(currentVideoId, playlistId)}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                </div>
                <button id="fechar-painel-youtube" class="yt-dark-close">&times;</button>
            </div>
            <div class="yt-dark-playlist-list">
                ${itens.map(item => `
                    <div class="yt-dark-playlist-item${item.snippet.resourceId.videoId === currentVideoId ? ' yt-dark-playlist-item-active' : ''}" data-videoid="${item.snippet.resourceId.videoId}">
                        <img class="yt-dark-playlist-thumb" src="${item.snippet.thumbnails.high ? item.snippet.thumbnails.high.url : item.snippet.thumbnails.default.url}" alt="">
                        <div class="yt-dark-playlist-meta">
                            <div class="yt-dark-playlist-item-title">${item.snippet.title}</div>
                            <div class="yt-dark-playlist-item-channel">${item.snippet.channelTitle}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        configurarEventosPlaylist(itens, playlistId);
    }

    // =================================================================================
    // EVENTOS
    // =================================================================================
    
    function configurarEventosPainel() {
        const inputTermo = painel.querySelector('#yt-termo');
        const linkIndicator = painel.querySelector('#yt-link-indicator');
        const linkText = painel.querySelector('#yt-link-text');
        const selectTipo = painel.querySelector('#yt-tipo');

        // Evento de fechar
        painel.querySelector('#fechar-painel-youtube').onclick = fecharPainel;

        // Evento de input para detectar links
        inputTermo.addEventListener('input', function() {
            const valor = this.value.trim();
            
            if (valor.includes('youtube.com') || valor.includes('youtu.be')) {
                const playlistId = extrairIdPlaylist(valor);
                const videoId = extrairIdVideo(valor);
                
                if (playlistId) {
                    linkIndicator.style.display = 'block';
                    linkText.textContent = '🔗 Link de Playlist detectado';
                    linkText.style.color = '#4CAF50';
                    selectTipo.value = 'playlist';
                } else if (videoId) {
                    linkIndicator.style.display = 'block';
                    linkText.textContent = '🔗 Link de Vídeo detectado';
                    linkText.style.color = '#2196F3';
                    selectTipo.value = 'video';
                } else {
                    linkIndicator.style.display = 'block';
                    linkText.textContent = '⚠️ Link do YouTube inválido';
                    linkText.style.color = '#FF9800';
                }
            } else {
                linkIndicator.style.display = 'none';
            }
        });

        // Evento de submit do formulário
        painel.querySelector('#yt-form').onsubmit = function(e) {
            e.preventDefault();
            const termo = inputTermo.value.trim();
            const tipo = selectTipo.value;
            
            if (!termo) return;
            
            processarBusca(termo, tipo, linkText);
        };

        // Eventos dos cards de resultado
        painel.querySelectorAll('.yt-dark-card').forEach(card => {
            card.onclick = function() {
                const videoId = this.getAttribute('data-videoid');
                const isVideo = this.getAttribute('data-isvideo') === 'true';
                
                if (isVideo) {
                    reproduzirVideo(videoId);
                } else {
                    carregarPlaylist(videoId);
                }
            };
        });
    }

    function configurarEventosPlaylist(itens, playlistId) {
        painel.querySelector('#fechar-painel-youtube').onclick = fecharPainel;

        painel.querySelectorAll('.yt-dark-playlist-item').forEach(div => {
            div.onclick = function() {
                const videoId = this.getAttribute('data-videoid');
                renderPainelPlaylist(itens, playlistId, videoId);
            };
        });
    }

    function alternarPainel() {
        if (painel.style.display === 'flex' && painel.style.opacity === '1') {
            fecharPainel();
        } else {
            abrirPainel();
        }
    }

    function abrirPainel() {
        mostrarPainelComAnimacao();
        document.body.classList.add('yt-aba-aberta');
        painel.style.top = '0';
        painel.style.height = '100vh';
        renderPainel(ultimoTermo, ultimoTipo, ultimosResultados);
    }

    function fecharPainel() {
        ocultarPainelComAnimacao();
        ocultarPlayerComAnimacao();
        painel.style.top = '0';
        painel.style.height = '100vh';
        document.body.classList.remove('yt-aba-aberta');
        
        // Limpa o campo de busca e indicador
        const inputTermo = painel.querySelector('#yt-termo');
        const linkIndicator = painel.querySelector('#yt-link-indicator');
        if (inputTermo) {
            inputTermo.value = '';
            if (linkIndicator) linkIndicator.style.display = 'none';
        }
    }

    // =================================================================================
    // PROCESSAMENTO DE BUSCA
    // =================================================================================
    
    function processarBusca(termo, tipo, linkText) {
        if (termo.includes('youtube.com') || termo.includes('youtu.be')) {
            processarLinkYouTube(termo, linkText);
        } else {
            buscarYoutube(termo, tipo);
        }
    }

    function processarLinkYouTube(termo, linkText) {
        const playlistId = extrairIdPlaylist(termo);
        if (playlistId) {
            linkText.textContent = '⏳ Carregando playlist...';
            linkText.style.color = '#FFC107';
            carregarPlaylist(playlistId);
            return;
        }
        
        const videoId = extrairIdVideo(termo);
        if (videoId) {
            linkText.textContent = '⏳ Carregando vídeo...';
            linkText.style.color = '#FFC107';
            reproduzirVideo(videoId);
            return;
        }
    }

    function reproduzirVideo(videoId) {
        const embedUrl = criarUrlEmbed(videoId);
        playerContainer.innerHTML = `
            <iframe width="100%" height="100%" src="${embedUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
        `;
        mostrarPlayerComAnimacao();
        painel.style.top = '180px';
        painel.style.height = 'calc(100vh - 180px)';
    }

    function carregarPlaylist(playlistId) {
        mostrarSpinner();
        buscarItensDaPlaylist(playlistId, function(itens, erro) {
            if (erro) {
                renderPainel('', 'playlist', null, erro);
                return;
            }
            const itensValidos = itens.filter(item => item.snippet && item.snippet.resourceId && item.snippet.resourceId.videoId);
            renderPainelPlaylist(itensValidos, playlistId);
            ocultarPlayerComAnimacao();
            painel.style.top = '0';
            painel.style.height = '100vh';
        });
    }

    // =================================================================================
    // API DO YOUTUBE
    // =================================================================================
    
    function buscarYoutube(termo, tipo) {
        ultimoTermo = termo;
        ultimoTipo = tipo;
        renderPainel(termo, tipo);
        mostrarSpinner();
        
        const tipoApi = tipo === 'playlist' ? 'playlist' : 'video';
        const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(termo)}&key=${YOUTUBE_API_KEY}&maxResults=12&type=${tipoApi}`;
        
        GM_xmlhttpRequest({
            method: 'GET',
            url: apiUrl,
            onload: function(response) {
                const data = JSON.parse(response.responseText);
                if (data.error) {
                    renderPainel(termo, tipo, null, `Erro: ${data.error.message}`);
                    return;
                }
                ultimosResultados = data.items || [];
                renderPainel(termo, tipo, ultimosResultados);
            },
            onerror: function() {
                renderPainel(termo, tipo, null, 'Erro de conexão com a API do YouTube.');
            }
        });
    }

    function buscarItensDaPlaylist(playlistId, callback) {
        const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}`;
        
        GM_xmlhttpRequest({
            method: 'GET',
            url: apiUrl,
            onload: function(response) {
                const data = JSON.parse(response.responseText);
                if (data.error) {
                    callback(null, data.error.message);
                    return;
                }
                callback(data.items, null);
            },
            onerror: function() {
                callback(null, 'Erro de conexão com a API do YouTube.');
            }
        });
    }

    // =================================================================================
    // INICIALIZAÇÃO
    // =================================================================================
    
    function adicionarBotaoCustomizado() {
        const seletorDoLocal = 'div.col.my-1.text-nowrap';
        const elementoPai = document.querySelector(seletorDoLocal);

        if (!elementoPai || document.getElementById('meu-botao-youtube')) {
            return;
        }

        criarPlayerContainer();
        criarPainel();
        const containerDoBotao = criarBotao();
        
        elementoPai.appendChild(containerDoBotao);
        console.log('[Script Krolik] Botão do YouTube adicionado com sucesso.');
    }

    // =================================================================================
    // CSS
    // =================================================================================
    
    function adicionarCSS() {
        const style = document.createElement('style');
        style.innerHTML = `
            body.yt-aba-aberta .jss341 {
                right: 350px !important;
                transition: right 0.2s;
            }
        `;
        document.head.appendChild(style);

        const styleDark = document.createElement('style');
        styleDark.innerHTML = `
            #painel-youtube {
                background: #181818 !important;
                color: #fff !important;
                font-family: 'Roboto', Arial, sans-serif;
                height: 100vh;
                display: flex;
                flex-direction: column;
            }
            .yt-dark-header {
                background: #202020;
                color: #fff;
                padding: 20px 0 12px 0;
                text-align: center;
                font-size: 1.2em;
                font-weight: bold;
                letter-spacing: 1px;
                position: relative;
                border-radius: 12px 12px 0 0;
            }
            .yt-dark-title {
                font-size: 1.1em;
                font-weight: bold;
            }
            .yt-dark-close {
                position: absolute;
                right: 16px;
                top: 10px;
                background: none;
                border: none;
                color: #fff;
                font-size: 1.5em;
                cursor: pointer;
                transition: color 0.2s;
            }
            .yt-dark-close:hover {
                color: #ff0000;
            }
            .yt-dark-search {
                display: flex;
                justify-content: center;
                padding-top: 10px;
                margin: 18px 0 12px 0;
                background: none;
                box-shadow: none;
            }
            .yt-dark-search-box {
                display: flex;
                align-items: center;
                background: rgba(30,30,30,0.85);
                border-radius: 32px;
                box-shadow: 0 2px 16px #0004;
                backdrop-filter: blur(8px);
                padding: 4px 8px 4px 12px;
                gap: 4px;
                min-width: 0;
            }
            .yt-dark-search-box input {
                background: transparent;
                color: #fff;
                border: none;
                outline: none;
                font-size: 1em;
                padding: 6px 8px;
                border-radius: 20px;
                min-width: 0;
                width: 120px;
                transition: background 0.2s;
                text-align: center;
            }
            .yt-dark-search-box input:focus {
                background: rgba(255,255,255,0.07);
            }
            .yt-dark-search-box input::placeholder {
                text-align: center;
            }
            .yt-dark-search-box select {
                background: #232323 !important;
                color: #fff !important;
                border: none;
                border-radius: 16px;
                padding: 6px 10px;
                font-size: 1em;
                outline: none;
                margin-left: 4px;
                margin-right: 4px;
                transition: background 0.2s;
                appearance: none;
                -webkit-appearance: none;
                -moz-appearance: none;
                box-shadow: none;
                cursor: pointer;
            }
            .yt-dark-search-box select:focus {
                background: #181818 !important;
                color: #fff !important;
            }
            .yt-dark-search-box select option {
                background: #181818 !important;
                color: #fff !important;
            }
            .yt-dark-search-btn {
                background: #ff0000;
                border: none;
                border-radius: 50%;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                margin-left: 4px;
                transition: background 0.2s, box-shadow 0.2s;
                box-shadow: 0 2px 8px #0003;
            }
            .yt-dark-search-btn:hover {
                background: #d90000;
            }
            .yt-dark-search-btn svg {
                display: block;
            }
            .yt-link-indicator {
                background: rgba(255,255,255,0.05);
                border-radius: 8px;
                padding: 8px 12px;
                margin: 8px 16px;
                text-align: center;
                font-size: 0.9em;
                border: 1px solid rgba(255,255,255,0.1);
            }
            .yt-link-indicator span {
                font-weight: 500;
            }
            .yt-dark-results {
                flex: 1 1 auto;
                min-height: 0;
                overflow-y: auto;
            }
            .yt-dark-card {
                display: flex;
                align-items: center;
                background: #232323;
                border-radius: 10px;
                box-shadow: 0 2px 8px #0002;
                padding: 8px 10px;
                cursor: pointer;
                transition: background 0.2s, box-shadow 0.2s;
            }
            .yt-dark-card:hover {
                background: #333;
                box-shadow: 0 4px 16px #0004;
            }
            .yt-dark-thumb {
                width: 80px;
                height: 48px;
                object-fit: cover;
                border-radius: 6px;
                margin-right: 14px;
                background: #111;
            }
            .yt-dark-info {
                flex: 1;
                min-width: 0;
            }
            .yt-dark-title {
                font-size: 1.05em;
                font-weight: bold;
                color: #fff;
                margin-bottom: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .yt-dark-channel {
                color: #aaa;
                font-size: 0.97em;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .yt-dark-nada {
                color: #888;
                text-align: center;
                margin: 18px 0;
            }
            .yt-dark-erro {
                color: #ff4444;
                text-align: center;
                margin: 18px 0;
                font-weight: bold;
            }
            .yt-dark-playlist-header {
                background: #232323;
                border-radius: 12px 12px 0 0;
                padding: 0;
                margin-bottom: 0;
                position: relative;
            }
            .yt-dark-playlist-player {
                width: 100%;
                height: ${ALTURA_PLAYER_PLAYLIST}px;
                border-radius: 12px 12px 0 0;
                overflow: hidden;
                background: #000;
            }
            .yt-dark-playlist-list {
                background: #181818;
                flex: 1 1 auto;
                overflow-y: auto;
                padding: 0 0 8px 0;
                border-radius: 0 0 12px 12px;
            }
            .yt-dark-playlist-item {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                cursor: pointer;
                border-radius: 8px;
                transition: background 0.15s;
                background: #232323;
                margin: 4px 8px;
            }
            .yt-dark-playlist-item:hover {
                background: #333;
            }
            .yt-dark-playlist-item-active {
                background: #ff0000 !important;
                color: #fff;
            }
            .yt-dark-playlist-thumb {
                width: 64px;
                height: 40px;
                object-fit: cover;
                border-radius: 6px;
                margin-right: 12px;
                background: #111;
            }
            .yt-dark-playlist-meta {
                flex: 1;
                min-width: 0;
            }
            .yt-dark-playlist-item-title {
                font-size: 1em;
                font-weight: bold;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .yt-dark-playlist-item-channel {
                font-size: 0.95em;
                color: #bbb;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .yt-dark-results, .yt-dark-playlist-list {
                scrollbar-width: thin;
                scrollbar-color: #ff0000 #232323;
            }
            .yt-dark-results::-webkit-scrollbar, .yt-dark-playlist-list::-webkit-scrollbar {
                width: 8px;
                background: #232323;
            }
            .yt-dark-results::-webkit-scrollbar-thumb, .yt-dark-playlist-list::-webkit-scrollbar-thumb {
                background: #ff0000;
                border-radius: 8px;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(styleDark);
    }

    // =================================================================================
    // INICIALIZAÇÃO
    // =================================================================================
    
    adicionarCSS();
    setTimeout(adicionarBotaoCustomizado, 3000);

})();