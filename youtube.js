// ==UserScript==
// @name         Buscar Músicas no YouTube (Krolik)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Busca músicas no YouTube e exibe em um popup.
// @author       Felipe Prado
// @match        https://app.camkrolik.com.br/*
// @connect      googleapis.com
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // =================================================================================
    // CONFIGURAÇÃO ESSENCIAL
    // =================================================================================
    const YOUTUBE_API_KEY = 'AIzaSyAcl9uhYqUJ2H1aU_CzF1fDXWA7A9fenrI';
    //TODO
    //Barra de pesquisa continuar aparecendo após clicar no video
    //Ser capaz de selecionar playlists
    //Ordem da playlist, todas que irão tocar a seguir, ser possível ver as musicas anteriores e também as próximas (parcialmente possível)
    // Visualizar a letra das músicas caso esteja disponível.
    // =================================================================================  


    function adicionarBotaoCustomizado() {
        const seletorDoLocal = 'div.jss24.flex.flex-col';
        const elementoPai = document.querySelector(seletorDoLocal);

        if (!elementoPai || document.getElementById('meu-botao-youtube')) {
            return;
        }

        // Largura da barra lateral de ícones
        const barraLateralLargura = 60; // px
        const larguraAbaYoutube = 350; // px

        // Criação do player fixo no topo direito
        let playerContainer = document.getElementById('yt-player-fixed');
        if (!playerContainer) {
            playerContainer = document.createElement('div');
            playerContainer.id = 'yt-player-fixed';
            playerContainer.style.cssText = `
                position: fixed;
                top: 0; right: ${barraLateralLargura}px; z-index: 100000;
                width: ${larguraAbaYoutube}px; height: 180px;
                background: #000;
                display: none;
                justify-content: center;
                align-items: center;
                box-shadow: -2px 0 12px #0002;
            `;
            document.body.appendChild(playerContainer);
        }

        // Criação do painel lateral (inicialmente oculto)
        let painel = document.getElementById('painel-youtube');
        if (!painel) {
            painel = document.createElement('div');
            painel.id = 'painel-youtube';
            painel.style.cssText = `
                position: fixed;
                top: 0;
                right: ${barraLateralLargura}px;
                height: 100vh;
                width: ${larguraAbaYoutube}px;
                z-index: 99999;
                background: #fff;
                box-shadow: -2px 0 12px #0002;
                display: none;
                flex-direction: column;
                overflow-y: auto;
                border-left: 1px solid #eee;
            `;
            document.body.appendChild(painel);
        }

        // Criação do botão
        const containerDoBotao = document.createElement('div');
        containerDoBotao.id = 'meu-botao-youtube';
        containerDoBotao.className = 'jss316 primary-color';
        containerDoBotao.style.cssText = 'visibility: visible; opacity: 1; transform-origin: 50% 50% 0px; transform: scaleX(1) scaleY(1);';
        const meuBotao = document.createElement('button');
        meuBotao.className = 'MuiButtonBase-root MuiIconButton-root MuiIconButton-colorInherit';
        meuBotao.type = 'button';
        meuBotao.title = 'Buscar músicas no YouTube';
        meuBotao.innerHTML = `<span class="MuiIconButton-label"><img src="https://toppng.com/uploads/preview/umbrella-corp-logo-115629074748jwup5drlq.png" style="width: 35px; height: 35px; border-radius: 6px;" alt="Logo YouTube"></span>`;

        // Função para renderizar o painel lateral
        function renderPainel(termoBusca = '', tipoBusca = 'video', resultados = null, erro = null) {
            painel.innerHTML = `
                <div style="background:#ff0000;color:#fff;padding:16px 0;text-align:center;font-size:1.2em;font-weight:bold;letter-spacing:1px;">
                    YouTube Busca
                    <button id="fechar-painel-youtube" style="float:right;margin-right:16px;background:none;border:none;color:#fff;font-size:1.2em;cursor:pointer;">&times;</button>
                </div>
                <form class="yt-search-bar" id="yt-form" style="display:flex;justify-content:center;align-items:center;margin:18px 0 12px 0;">
                    <input type="text" id="yt-termo" placeholder="Pesquisar vídeos ou playlists..." value="${termoBusca.replace(/"/g, '&quot;')}" required style="width:120px;padding:8px 8px;font-size:1em;border:1px solid #ccc;border-radius:2px 0 0 2px;outline:none;">
                    <select id="yt-tipo" style="padding:8px 6px;border:1px solid #ccc;border-left:none;border-radius:0;">
                        <option value="video" ${tipoBusca === 'video' ? 'selected' : ''}>Vídeo</option>
                        <option value="playlist" ${tipoBusca === 'playlist' ? 'selected' : ''}>Playlist</option>
                    </select>
                    <button type="submit" style="background:#ff0000;color:#fff;border:none;padding:8px 12px;font-size:1em;border-radius:0 2px 2px 0;cursor:pointer;">Buscar</button>
                </form>
                ${erro ? `<div style="color:#c00;text-align:center;margin:18px 0;">${erro}</div>` : ''}
                <div class="yt-results" style="display:flex;flex-direction:column;gap:12px;justify-content:center;margin:0 8px;">
                    ${
                        resultados
                            ? (resultados.length
                                ? resultados.map(item => {
                                    let url, thumb, title, channel, videoId, isVideo;
                                    if (tipoBusca === 'video') {
                                        videoId = item.id.videoId;
                                        url = `https://www.youtube.com/watch?v=${videoId}`;
                                        thumb = item.snippet.thumbnails.high.url;
                                        title = item.snippet.title;
                                        channel = item.snippet.channelTitle;
                                        isVideo = true;
                                    } else {
                                        videoId = item.id.playlistId;
                                        url = `https://www.youtube.com/playlist?list=${videoId}`;
                                        thumb = item.snippet.thumbnails.high.url;
                                        title = item.snippet.title;
                                        channel = item.snippet.channelTitle;
                                        isVideo = false;
                                    }
                                    return `
                                        <div class="yt-card" style="background:#fff;border-radius:6px;box-shadow:0 2px 8px #0001;width:100%;overflow:hidden;text-decoration:none;color:#111;transition:box-shadow 0.2s;display:flex;gap:8px;align-items:center;cursor:pointer;" data-videoid="${videoId}" data-isvideo="${isVideo}">
                                            <img class="yt-thumb" src="${thumb}" alt="" style="width:60px;height:40px;object-fit:cover;background:#eee;">
                                            <div class="yt-info" style="flex:1;">
                                                <div class="yt-title" style="font-size:1em;font-weight:bold;margin:0 0 4px 0;">${title}</div>
                                                <div class="yt-channel" style="color:#555;font-size:0.95em;">${channel}</div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')
                                : '<div style="width:100%;text-align:center;color:#888;">Nenhum resultado encontrado.</div>'
                            )
                            : ''
                    }
                </div>
            `;

            // Fechar painel (apenas oculta o painel, player continua)
            painel.querySelector('#fechar-painel-youtube').onclick = () => {
                painel.style.display = 'none';
                playerContainer.style.visibility = 'hidden';
                document.body.classList.remove('yt-aba-aberta');
            };

            // Evento de busca
            painel.querySelector('#yt-form').onsubmit = function(e) {
                e.preventDefault();
                const termo = painel.querySelector('#yt-termo').value.trim();
                const tipo = painel.querySelector('#yt-tipo').value;
                if (termo) buscarYoutube(termo, tipo);
            };

            // Evento para tocar vídeo/playlist no player fixo
            painel.querySelectorAll('.yt-card').forEach(card => {
                card.onclick = function() {
                    const videoId = this.getAttribute('data-videoid');
                    const isVideo = this.getAttribute('data-isvideo') === 'true';
                    let embedUrl = '';
                    if (isVideo) {
                        embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
                    } else {
                        embedUrl = `https://www.youtube.com/embed/videoseries?list=${videoId}&autoplay=1`;
                    }
                    playerContainer.innerHTML = `
                        <iframe width="100%" height="100%" src="${embedUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                    `;
                    playerContainer.style.display = 'flex';
                };
            });
        }

        // Função para buscar no YouTube
        function buscarYoutube(termo, tipo) {
            renderPainel(termo, tipo); // Mostra carregando
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
                    renderPainel(termo, tipo, data.items || []);
                },
                onerror: function() {
                    renderPainel(termo, tipo, null, 'Erro de conexão com a API do YouTube.');
                }
            });
        }

        // Alternar painel ao clicar no botão
        meuBotao.addEventListener('click', () => {
            if (painel.style.display === 'flex') {
                painel.style.display = 'none';
                playerContainer.style.visibility = 'hidden';
                document.body.classList.remove('yt-aba-aberta');
            } else {
                const seletorNomeContato = 'header span[title]';
                const elementoNome = document.querySelector(seletorNomeContato);
                const termoBusca = elementoNome ? elementoNome.innerText : 'Músicas';
                painel.style.display = 'flex';
                playerContainer.style.visibility = 'visible';
                document.body.classList.add('yt-aba-aberta');
                buscarYoutube(termoBusca, 'video');
            }
        });

        // Adiciona o botão à página
        containerDoBotao.appendChild(meuBotao);
        elementoPai.appendChild(containerDoBotao);
        console.log('[Script Krolik] Botão do YouTube adicionado com a função de busca.');
    }

    setTimeout(adicionarBotaoCustomizado, 3000);

    // CSS para responsividade da aba lateral
    const style = document.createElement('style');
    style.innerHTML = `
    body.yt-aba-aberta .jss341 {
        right: 350px !important;
        transition: right 0.2s;
    }
    `;
    document.head.appendChild(style);

})();