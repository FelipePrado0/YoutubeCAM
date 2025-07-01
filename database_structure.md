# Estrutura de Banco de Dados - Script YouTube

## 📋 Visão Geral

Este documento descreve a estrutura de banco de dados relacional para armazenar os dados do script do YouTube, focando especificamente em:
- Histórico de vídeos assistidos
- Favoritos do usuário
- Sistema de cache inteligente

---

## 🗄️ Estrutura das Tabelas

### 1. Tabela: `users` (Usuários)

```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE
);
```

**Descrição:**
- Armazena informações básicas dos usuários
- Suporte para múltiplos usuários no sistema
- Controle de status ativo/inativo

---

### 2. Tabela: `user_history` (Histórico de Vídeos Assistidos)

```sql
CREATE TABLE user_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    youtube_video_id VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    channel_name VARCHAR(100) NOT NULL,
    thumbnail_url TEXT,
    watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user_watched (user_id, watched_at DESC),
    INDEX idx_youtube_id (youtube_video_id),
    UNIQUE KEY unique_user_video (user_id, youtube_video_id)
);
```

**Descrição:**
- Registra todos os vídeos assistidos pelo usuário
- Evita duplicatas com constraint único
- Ordenação por data de visualização
- Relacionamento com tabela de usuários

**Campos:**
- `youtube_video_id`: ID único do vídeo no YouTube (ex: dQw4w9WgXcQ)
- `title`: Título do vídeo
- `channel_name`: Nome do canal
- `thumbnail_url`: URL da thumbnail
- `watched_at`: Data/hora da visualização

---

### 3. Tabela: `user_favorites` (Favoritos)

```sql
CREATE TABLE user_favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    youtube_id VARCHAR(20) NOT NULL,
    content_type ENUM('video', 'playlist') NOT NULL,
    title VARCHAR(255) NOT NULL,
    channel_name VARCHAR(100) NOT NULL,
    thumbnail_url TEXT,
    favorited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user_favorites (user_id, favorited_at DESC),
    INDEX idx_youtube_id (youtube_id),
    UNIQUE KEY unique_user_content (user_id, youtube_id, content_type)
);
```

**Descrição:**
- Armazena vídeos e playlists favoritados
- Suporte para diferentes tipos de conteúdo
- Evita duplicatas por usuário e conteúdo
- Ordenação por data de favoritação

**Campos:**
- `youtube_id`: ID do conteúdo no YouTube
- `content_type`: Tipo (video ou playlist)
- `title`: Título do conteúdo
- `channel_name`: Nome do canal
- `thumbnail_url`: URL da thumbnail
- `favorited_at`: Data/hora da favoritação

---

### 4. Tabela: `cache_entries` (Cache do Sistema)

```sql
CREATE TABLE cache_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    cache_type ENUM('thumbnail', 'search', 'video_info') NOT NULL,
    cache_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    
    INDEX idx_cache_key (cache_key),
    INDEX idx_expires_at (expires_at),
    INDEX idx_cache_type (cache_type)
);
```

**Descrição:**
- Sistema de cache inteligente
- Armazena dados em formato JSON
- Controle de expiração automática
- Suporte para diferentes tipos de cache

**Tipos de Cache:**
- `thumbnail`: URLs de thumbnails
- `search`: Resultados de buscas
- `video_info`: Informações completas de vídeos

---

## 🔧 Índices de Performance

```sql
-- Índices adicionais para consultas frequentes
CREATE INDEX idx_history_recent ON user_history(watched_at DESC);
CREATE INDEX idx_favorites_recent ON user_favorites(favorited_at DESC);
CREATE INDEX idx_cache_cleanup ON cache_entries(expires_at, cache_type);
```

**Benefícios:**
- Consultas mais rápidas
- Ordenação eficiente
- Limpeza automática de cache

---

## 📊 Consultas Úteis

### Histórico do Usuário

#### Últimos Vídeos Assistidos
```sql
SELECT * FROM user_history 
WHERE user_id = ? 
ORDER BY watched_at DESC 
LIMIT 20;
```

#### Canais Mais Assistidos
```sql
SELECT channel_name, COUNT(*) as watch_count 
FROM user_history 
WHERE user_id = ? 
GROUP BY channel_name 
ORDER BY watch_count DESC;
```

#### Estatísticas de Visualização
```sql
SELECT 
    DATE(watched_at) as date,
    COUNT(*) as videos_watched
FROM user_history 
WHERE user_id = ? 
GROUP BY DATE(watched_at)
ORDER BY date DESC;
```

### Favoritos do Usuário

#### Todos os Favoritos
```sql
SELECT * FROM user_favorites 
WHERE user_id = ? 
ORDER BY favorited_at DESC;
```

#### Favoritos por Tipo
```sql
SELECT * FROM user_favorites 
WHERE user_id = ? AND content_type = 'video' 
ORDER BY favorited_at DESC;
```

#### Contagem de Favoritos
```sql
SELECT 
    content_type,
    COUNT(*) as total
FROM user_favorites 
WHERE user_id = ? 
GROUP BY content_type;
```

### Cache

#### Buscar Cache Válido
```sql
SELECT cache_data FROM cache_entries 
WHERE cache_key = ? AND expires_at > NOW();
```

#### Limpar Cache Expirado
```sql
DELETE FROM cache_entries WHERE expires_at < NOW();
```

#### Estatísticas do Cache
```sql
SELECT 
    cache_type,
    COUNT(*) as total_entries,
    COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as valid_entries
FROM cache_entries 
GROUP BY cache_type;
```

---

## 📋 Estrutura de Dados JSON

### Cache de Busca
```json
{
  "data": [
    {
      "id": {"videoId": "dQw4w9WgXcQ"},
      "snippet": {
        "title": "Never Gonna Give You Up",
        "channelTitle": "Rick Astley",
        "thumbnails": {
          "high": {"url": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"}
        }
      }
    }
  ],
  "timestamp": 1234567890
}
```

### Cache de Informações de Vídeo
```json
{
  "titulo": "Never Gonna Give You Up",
  "canal": "Rick Astley",
  "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
}
```

### Cache de Thumbnail
```json
"https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
```

---

## 🚀 Vantagens da Estrutura

### 1. **Simplicidade**
- Apenas os dados essenciais
- Sem tabelas desnecessárias
- Fácil de entender e manter

### 2. **Performance**
- Índices otimizados
- Consultas eficientes
- Cache inteligente

### 3. **Escalabilidade**
- Suporte para múltiplos usuários
- Limpeza automática de cache
- Controle de duplicatas

### 4. **Flexibilidade**
- Dados JSON para cache
- Suporte para diferentes tipos de conteúdo
- Fácil extensão futura

### 5. **Integridade**
- Foreign keys para relacionamentos
- Constraints para evitar duplicatas
- Controle de expiração

---

## 🔄 Fluxo de Dados

### 1. **Usuário Assiste um Vídeo**
```
Script → Salva em user_history → Cache de thumbnail
```

### 2. **Usuário Favorita um Vídeo**
```
Script → Salva em user_favorites → Cache de informações
```

### 3. **Usuário Faz uma Busca**
```
Script → Verifica cache → Se não existe, busca API → Salva no cache
```

### 4. **Limpeza Automática**
```
Sistema → Remove cache expirado → Mantém performance
```

---

## 📈 Estatísticas e Relatórios

### Relatório de Uso Diário
```sql
SELECT 
    DATE(watched_at) as date,
    COUNT(*) as videos_watched,
    COUNT(DISTINCT channel_name) as channels_watched
FROM user_history 
WHERE user_id = ? 
GROUP BY DATE(watched_at)
ORDER BY date DESC;
```

### Top Canais Favoritos
```sql
SELECT 
    channel_name,
    COUNT(*) as favorite_count
FROM user_favorites 
WHERE user_id = ? 
GROUP BY channel_name
ORDER BY favorite_count DESC
LIMIT 10;
```

### Eficiência do Cache
```sql
SELECT 
    cache_type,
    ROUND(AVG(TIMESTAMPDIFF(SECOND, created_at, expires_at)/3600), 2) as avg_hours,
    COUNT(*) as total_entries
FROM cache_entries 
GROUP BY cache_type;
```

---

## 🛠️ Manutenção

### Limpeza de Dados Antigos
```sql
-- Remove histórico com mais de 1 ano
DELETE FROM user_history 
WHERE watched_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- Remove cache expirado
DELETE FROM cache_entries 
WHERE expires_at < NOW();
```

### Backup de Dados Importantes
```sql
-- Backup de favoritos
SELECT * FROM user_favorites WHERE user_id = ?;

-- Backup de histórico recente
SELECT * FROM user_history 
WHERE user_id = ? AND watched_at > DATE_SUB(NOW(), INTERVAL 30 DAY);
```

---

## 📝 Notas de Implementação

### Considerações de Performance
- Índices em campos frequentemente consultados
- Limpeza automática de cache expirado
- Constraints para evitar duplicatas

### Segurança
- Foreign keys para integridade referencial
- Validação de dados de entrada
- Controle de acesso por usuário

### Escalabilidade
- Estrutura preparada para múltiplos usuários
- Cache distribuído por tipo
- Limpeza automática de dados antigos

---

*Documento gerado para o Script YouTube - Sistema de Cache Inteligente* 