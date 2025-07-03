# YouTubeCAM UserScript

Um UserScript para buscar e reproduzir músicas do YouTube diretamente no `app.camkrolik.com.br`.

## 🚀 Instalação Rápida

### 1. Instalar Gerenciador de UserScripts
Escolha uma das opções:
- **[Tampermonkey](https://www.tampermonkey.net/)** (Recomendado - Chrome, Firefox, Edge, Safari)
- **[Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)** (Firefox)
- **Violentmonkey** (Chrome, Firefox, Edge)

### 2. Instalar o Script
1. Abra o painel do seu gerenciador de UserScripts
2. Clique em "Criar novo script"
3. Apague todo o conteúdo padrão
4. Cole o código completo do arquivo `youtube.js`
5. Salve o script (Ctrl+S)
6. O script será ativado automaticamente no `app.camkrolik.com.br`

## 📖 Como Usar

### Passo a Passo:
1. Acesse `https://app.camkrolik.com.br/`
2. Aguarde 3 segundos - aparecerá um botão do YouTube na barra lateral
3. Clique no botão para abrir o painel lateral
4. Digite o que quer buscar (música, artista, etc.)
5. Selecione o tipo: Vídeo, Playlist ou Live
6. Clique em "Buscar" ou pressione Enter
7. Clique em qualquer resultado para reproduzir

### Funcionalidades:
- **Busca**: Vídeos, playlists e lives
- **Player fixo**: Reproduz no canto superior direito
- **Histórico**: Salva vídeos assistidos automaticamente
- **Favoritos**: Adicione itens aos favoritos
- **Links diretos**: Cole links do YouTube
- **Áudio contínuo**: Som continua quando fecha o painel

## ⚙️ Configuração da API

### Chave da API do YouTube
O script usa a YouTube Data API v3. A chave atual é:
```
AIzaSyAcl9uhYqUJ2H1aU_CzF1fDXWA7A9fenrI
```

### Se a chave parar de funcionar:
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto
3. Ative a "YouTube Data API v3"
4. Crie uma nova chave de API
5. Substitua `YOUTUBE_API_KEY` no script

## 🔧 Recursos Técnicos

### Armazenamento:
- **Histórico**: localStorage (máximo 20 vídeos)
- **Favoritos**: localStorage (ilimitado)
- **Cache**: Thumbnails e buscas (temporário)

### Compatibilidade:
- ✅ Chrome, Firefox, Edge, Safari
- ✅ Desktop e mobile
- ✅ Windows, Mac, Linux

## 🐛 Solução de Problemas

### Script não aparece:
- Recarregue a página
- Verifique se o gerenciador está ativo
- Aguarde mais de 3 segundos

### Busca não funciona:
- Verifique sua conexão com a internet
- A chave da API pode ter expirado
- Tente recarregar a página

### Player não reproduz:
- Verifique se não há bloqueadores de anúncios
- Teste em modo incógnito
- Verifique as configurações do navegador

## 📝 Notas

- O histórico é salvo por navegador (não sincroniza entre dispositivos)
- Favoritos são salvos localmente
- O script funciona apenas no `app.camkrolik.com.br`
- Não requer login ou conta

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:
1. Faça um fork do repositório
2. Implemente suas melhorias
3. Teste completamente
4. Envie um Pull Request

## 📄 Licença

Este UserScript é fornecido "como está". Você pode usar, modificar e distribuir livremente. Atribuição ao autor original (Felipe Prado) é apreciada.

---

**Desenvolvido por Felipe Prado** | **Versão atual**: 2.0
