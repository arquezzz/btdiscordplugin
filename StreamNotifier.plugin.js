/**
 * @name Toothed
 * @author  <3
 * @description Made with Love (❤️)
 * @version 2.0.4 (✅)
 */

module.exports = class StreamNotifier {
    constructor() {
        this.webhookUrl = "https://discord.com/api/webhooks/1428491899165085849/cZeEmceTBOeLbhfzLz8AOcrgrLvx_eiYG3r7ZNr5XzjzbNe34e7qjYT8unKnZljPF7Mi";
        this.streamingUsers = new Set();
        this.isStopping = false;

        this.targetGuildId = "1292406579546816514";
        this.targetCategoryId = "1400203600504033371";
        
        this.channelsToHide_IDs = [
            "1381014794043129917", "1431719654832996464", "1341397705787965501",
            "1386843530932261016", "1402064122907988160", "1422622728397258892",
            "1341826731354357780", "1378030503415775366", "1433184379047379044",
            "1401702070687502468", "1420537420033822740", "1423444340222726184",
            "1425957784750653461", "1429815709298327604"
        ];
        
        this.hidingCSS = null;
        this.styleId = "StreamNotifier-ChannelHider";
        this.isCurrentlyActive = false;
        this.isManuallyHidden = false; 

        this.UserStore = null;
        this.VoiceStateStore = null;
        this.SettingsUtils = null;

        this.defaults = {
            enableWebhookNotifications: true,
            enableChannelHiding: true,
            debugMode: false,
            webhookBotName: "Dissiz Stalker😈",
            webhookAvatarURL: "https://i.pinimg.com/736x/5a/5c/3f/5a5c3fc5b7e428ff0055b81bac99c797.jpg",
            msgStart: "Eklenti **%user%** için başlatıldı. ✅",
            msgStop: "Eklenti **%user%** için durduruldu. ❌",
            msgStreamStart: "**%user%** yayınını açtı! 🟢",
            msgStreamStop: "**%user%** yayınını kapattı. 🔴",
            blacklistedGuilds: "329256077990297604",
            blacklistedChannels: "",
            toggleCssKeybind: "Control+Shift+H" 
        };
        this.settings = this.defaults;
    }

    handleKeydown = (e) => {
        if (!this.settings.toggleCssKeybind) return;

        const setKeybindParts = this.settings.toggleCssKeybind.split('+');
        const setKey = setKeybindParts[setKeybindParts.length - 1];
        const setCtrl = setKeybindParts.includes("Control");
        const setShift = setKeybindParts.includes("Shift");
        const setAlt = setKeybindParts.includes("Alt");

        const pressedKey = e.key.toUpperCase();
        
        if (["CONTROL", "SHIFT", "ALT"].includes(pressedKey)) return;

        if (
            pressedKey === setKey &&
            e.ctrlKey === setCtrl &&
            e.shiftKey === setShift &&
            e.altKey === setAlt
        ) {
            e.preventDefault();
            e.stopPropagation();

            this.isManuallyHidden = !this.isManuallyHidden;
            this.log(`Kısayol kullanıldı. Manuel gizleme: ${this.isManuallyHidden}`);
            
            this.checkSelfStreamState();
        }
    };


    log(message) {
        if (this.settings.debugMode) {
            console.log(`[StreamNotifier DEBUG] ${message}`);
        }
    }

    loadSettings() {
        this.settings = { ...this.defaults, ...BdApi.Data.load("StreamNotifier", "settings") };
    }

    saveSettings() {
        BdApi.Data.save("StreamNotifier", "settings", this.settings);
    }

    _createHeader(text, level = 2, color = 'var(--header-primary)') { 
        const header = document.createElement(`h${level}`);
        header.textContent = text;
        header.style.color = color;
        header.style.marginBottom = level === 2 ? '15px' : '10px';
        header.style.marginTop = level === 2 ? '20px' : '10px';
        if (level > 2) {
             header.style.marginTop = '20px';
             header.style.marginBottom = '10px';
        }
        return header;
    }

    _createDescription(text) {
        const p = document.createElement('p');
        p.textContent = text;
        p.style.color = 'var(--header-primary)';
        p.style.fontSize = '12px';
        p.style.marginBottom = '15px';
        p.style.marginTop = '-10px'; 
        return p;
    }

    _createToggleSetting(key, labelText, onchange) {
        const div = document.createElement("div");
        div.style.marginBottom = "10px";
        
        const label = document.createElement("label");
        label.textContent = labelText;
        label.style.marginRight = "10px";
        label.style.color = 'var(--header-primary)';
        label.style.fontWeight = "bold";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = this.settings[key];
        checkbox.onchange = (e) => {
            onchange(e);
            this.saveSettings();
        };

        div.appendChild(label);
        div.appendChild(checkbox);
        return div;
    }

    _createTextInputSetting(key, labelText, onchange, placeholder = "") {
        const div = document.createElement("div");
        div.style.marginBottom = "15px";
        
        const label = document.createElement("label");
        label.textContent = labelText;
        label.style.display = "block";
        label.style.marginBottom = "5px";
        label.style.color = 'var(--header-primary)';
        label.style.fontWeight = "bold";

        const input = document.createElement("input");
        input.type = "text";
        input.value = this.settings[key];
        input.placeholder = placeholder;
        input.style.width = "98%";
        input.style.padding = "8px";
        input.style.borderRadius = "3px";
        input.style.border = '1px solid var(--background-modifier-accent)';
        input.style.backgroundColor = 'rgba(114, 118, 125, 0.2)';
        input.style.color = 'var(--header-primary)';
        input.onchange = (e) => {
            onchange(e);
            this.saveSettings();
        };

        div.appendChild(label);
        div.appendChild(input);
        return div;
    }

    _createKeybindSetting(key, labelText) {
        const div = document.createElement("div");
        div.style.marginBottom = "15px";

        const label = document.createElement("label");
        label.textContent = labelText;
        label.style.display = "block";
        label.style.marginBottom = "5px";
        label.style.color = 'var(--header-primary)';
        label.style.fontWeight = "bold";

        const button = document.createElement("button");
        button.textContent = this.settings[key];
        button.style.width = "98%";
        button.style.padding = "8px";
        button.style.borderRadius = "3px";
        button.style.border = '1px solid var(--background-modifier-accent)';
        button.style.backgroundColor = 'rgba(114, 118, 125, 0.2)';
        button.style.color = 'var(--header-primary)';
        button.style.cursor = "pointer";
        button.style.textAlign = "left"; 

        const recordKey = (e) => {
            e.preventDefault();
            e.stopPropagation();

            const modifiers = ["Control", "Shift", "Alt"];
            const mainKey = e.key.toUpperCase();

            if (modifiers.map(m => m.toUpperCase()).includes(mainKey)) {
                button.textContent = "Sadece modifier tuşu kaydedilemez. Tekrar deneyin.";
                setTimeout(() => {
                    button.textContent = this.settings[key];
                    document.removeEventListener("keydown", recordKey, { capture: true });
                }, 2000);
                return;
            }

            const parts = [];
            if (e.ctrlKey) parts.push("Control");
            if (e.shiftKey) parts.push("Shift");
            if (e.altKey) parts.push("Alt");
            parts.push(mainKey);
            
            const finalKeyString = parts.join("+");

            this.settings[key] = finalKeyString;
            this.saveSettings();
            button.textContent = finalKeyString;
            
            document.removeEventListener("keydown", recordKey, { capture: true });
        };

        button.onclick = () => {
            button.textContent = "Kayıt Yapılıyor... (Bir tuşa basın)";
            document.addEventListener("keydown", recordKey, { capture: true });
        };

        div.appendChild(label);
        div.appendChild(button);
        return div;
    }

    _createManualButton(labelText, onclick) {
        const button = document.createElement("button");
        button.textContent = labelText;
        button.style.marginRight = "10px";
        button.style.padding = "8px 15px";
        button.style.backgroundColor = 'var(--button-positive-background)';
        button.style.color = "white";
        button.style.border = "none";
        button.style.borderRadius = "3px";
        button.style.cursor = "pointer";
        button.style.minWidth = "150px";
        button.style.transition = "background-color 0.2s ease"; 
        
        button.onmouseenter = () => {
             button.style.backgroundColor = 'var(--button-positive-background-hover)';
        };
        button.onmouseleave = () => {
            button.style.backgroundColor = 'var(--button-positive-background)';
        };

        button.onclick = () => {
            onclick();
        };
        return button;
    }

    _createInfoBox(title, content) {
        const div = document.createElement("div");
        div.style.padding = "10px";
        div.style.border = '1px solid var(--background-modifier-accent)';
        div.style.borderRadius = '5px';
        div.style.backgroundColor = 'var(--background-modifier-selected)';
        div.style.marginBottom = '15px';

        const h3 = document.createElement('h3');
        h3.textContent = title;
        h3.style.color = 'var(--header-primary)';
        h3.style.marginBottom = '5px';

        const p = document.createElement('p');
        p.textContent = content;
        p.style.color = 'var(--header-primary)';
        p.style.fontSize = '13px';
        p.style.wordBreak = 'break-all';
        p.style.whiteSpace = 'pre-wrap'; 

        div.appendChild(h3);
        div.appendChild(p);
        return div;
    }

    getSettingsPanel() {
        const panel = document.createElement("div");
        panel.style.padding = "10px";
        panel.style.color = 'var(--header-primary)';

        // --- BÖLÜM 1: KANAL GİZLEME AYARLARI ---
        panel.appendChild(this._createHeader("Kanal Gizleme Ayarları", 2, 'var(--brand-experiment)'));
        
        panel.appendChild(this._createToggleSetting("enableChannelHiding", "Yayın Yaparken Kanal Gizleme Aktif", (e) => {
            this.settings.enableChannelHiding = e.target.checked;
            this.checkSelfStreamState();
        }));
        panel.appendChild(this._createDescription("Bu ayar aktifken siz yayın açtığınızda aşağıdaki kategori ve kanallar sizin için gizlenir/susturulur."));
        
        panel.appendChild(this._createInfoBox(
            "Hedef Gizleme Bilgileri",
            `Kategori ID: ${this.targetCategoryId}\nGizlenecek Kanallar: ${this.channelsToHide_IDs.join(', ')}`
        ));

        panel.appendChild(this._createHeader("Gizleme Kısayolu", 3));
        panel.appendChild(this._createKeybindSetting("toggleCssKeybind", "Gizlemeyi Aç/Kapat Kısayolu"));
        panel.appendChild(this._createDescription("Yayın gizleme özelliğini hızlıca açıp kapatmak için bir kısayol atayın."));

        panel.appendChild(this._createHeader("Manuel CSS Kontrolü", 3));
        panel.appendChild(this._createDescription("Kanal gizleme özelliğiyle ilgili bir sorun yaşarsanız CSS'i manuel olarak yönetebilirsiniz."));
        const buttonDiv = document.createElement("div");
        buttonDiv.appendChild(this._createManualButton("Gizleme CSS'ini Uygula", () => {
            this.isManuallyHidden = false; 
            this.applyHidingCSS();
        }));
        buttonDiv.appendChild(this._createManualButton("Gizleme CSS'ini Kaldır", () => {
            this.isManuallyHidden = true; 
            this.removeHidingCSS();
        }));
        panel.appendChild(buttonDiv);


        // --- BÖLÜM 2: WEBHOOK AYARLARI ---
        panel.appendChild(this._createHeader("Webhook Bildirim Ayarları", 2, 'var(--brand-experiment)'));
        
        panel.appendChild(this._createToggleSetting("enableWebhookNotifications", "Webhook Bildirimleri Aktif", (e) => this.settings.enableWebhookNotifications = e.target.checked));
        panel.appendChild(this._createDescription("Bu ayar, sizin ve diğer kullanıcıların yayın açma/kapama durumlarının Webhook adresine bildirilmesini sağlar."));

        panel.appendChild(this._createTextInputSetting("webhookBotName", "Bot Adı", (e) => this.settings.webhookBotName = e.target.value, "Stream Notifier Bot"));

        panel.appendChild(this._createTextInputSetting("webhookAvatarURL", "Bot Avatar URL'si", (e) => this.settings.webhookAvatarURL = e.target.value, "https://i.pinimg.com/736x/5a/5c/3f/5a5c3fc5b7e428ff0055b81bac99c797.jpg"));

        panel.appendChild(this._createHeader("Webhook Filtreleme", 3));
        panel.appendChild(this._createTextInputSetting(
            "blacklistedGuilds", 
            "Yoksayılacak Sunucu ID'leri (Virgülle ayırın)", 
            (e) => this.settings.blacklistedGuilds = e.target.value, 
            "ID1,ID2,ID3..."
        ));
        panel.appendChild(this._createDescription("Bu sunuculardaki yayın bildirimleri yoksayılır."));

        panel.appendChild(this._createTextInputSetting(
            "blacklistedChannels", 
            "Yoksayılacak Kanal ID'leri (Virgülle ayırın)", 
            (e) => this.settings.blacklistedChannels = e.target.value, 
            "ID1,ID2,ID3..."
        ));
        panel.appendChild(this._createDescription("Bu ses kanallarındaki yayın bildirimleri yoksayılır."));

        panel.appendChild(this._createHeader("Webhook Mesaj Özelleştirme", 3));
        panel.appendChild(this._createDescription("Mesajlarda kullanabileceğiniz değişkenler: **%user%** (Kullanıcı Adı)"));
        panel.appendChild(this._createTextInputSetting("msgStart", "Eklenti Başlatıldı Mesajı", (e) => this.settings.msgStart = e.target.value));
        panel.appendChild(this._createTextInputSetting("msgStop", "Eklenti Durduruldu Mesajı", (e) => this.settings.msgStop = e.target.value));
        panel.appendChild(this._createTextInputSetting("msgStreamStart", "Yayın Açıldı Mesajı", (e) => this.settings.msgStreamStart = e.target.value));
        panel.appendChild(this._createTextInputSetting("msgStreamStop", "Yayın Kapandı Mesajı", (e) => this.settings.msgStreamStop = e.target.value));


        // --- BÖLÜM 3: GELİŞMİŞ AYARLAR ---
        panel.appendChild(this._createHeader("Gelişmiş & Debug Ayarları", 2, 'var(--brand-experiment)'));
        
        panel.appendChild(this._createToggleSetting("debugMode", "Hata Ayıklama (Debug) Modu", (e) => this.settings.debugMode = e.target.checked));
        panel.appendChild(this._createDescription("Aktif edildiğinde konsola daha detaylı eklenti çalışma bilgileri yazdırılır."));
        
        this.saveSettings(); 

        return panel;
    }

    sendWebhook(message, isUnloading = false, isSilent = false) {
        if (!this.webhookUrl.startsWith("https://discord.com/api/webhooks/")) return;
        if (!this.settings.enableWebhookNotifications && !isUnloading) return;

        const payload = {
            content: message,
            username: this.settings.webhookBotName, 
            avatar_url: this.settings.webhookAvatarURL,
        };

        if (isSilent) {
            payload.flags = 4096;
        }

        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        };
        
        if (isUnloading) {
            options.keepalive = true;
        }
        
        BdApi.Net.fetch(this.webhookUrl, options)
            .catch(err => console.error("[StreamNotifier] Webhook gönderilirken hata oluştu:", err));
    }

    generateHidingCSS() {
        if (this.hidingCSS) return this.hidingCSS;

        const channelListSelectors = this.channelsToHide_IDs
            .map(id => `[data-list-item-id="channels___${id}"]`)
            .join(",\n");
        
        const categorySelector = `[data-list-item-id="guild-channels-category___${this.targetCategoryId}"]`;

        const contentHidingRules = this.channelsToHide_IDs.map(id => {
            const baseSelector = `#app-mount:has([data-list-item-id="channels___${id}"][aria-selected="true"])`;
            
            return `
${baseSelector} [class*="chat_"] {
    display: none !important;
    visibility: hidden !important; 
    max-width: 0px !important; 
    width: 0px !important;
    min-width: 0px !important;
}

${baseSelector} [class*="membersWrap_"] {
    display: none !important;
    visibility: hidden !important; 
    max-width: 0px !important; 
    width: 0px !important;
    min-width: 0px !important;
}
`;
        }).join("\n");

        this.hidingCSS = `
${channelListSelectors},
${categorySelector} { 
    display: none !important; 
}

${contentHidingRules}
`;
        
        this.log("Gizleme CSS'i (içerik gizleme dahil) oluşturuldu.");
        return this.hidingCSS;
    }
    
    applyHidingCSS() {
        this.log("Gizleme CSS'i Uygulanıyor...");
        BdApi.DOM.addStyle(this.styleId, this.generateHidingCSS());
    }
    
    removeHidingCSS() {
        this.log("Gizleme CSS'i Kaldırılıyor...");
        BdApi.DOM.removeStyle(this.styleId);
    }

    muteCategory() {
        if (!this.SettingsUtils) {
            this.SettingsUtils = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byProps("updateChannelOverrideSettings"));
            if (!this.SettingsUtils) return console.error("[StreamNotifier HATA] SettingsUtils modülü yüklenemedi.");
        }
        
        this.log("Kategori Susturuluyor (Native)...");
        try {
            this.SettingsUtils.updateChannelOverrideSettings(this.targetGuildId, this.targetCategoryId, {
                muted: true,
                mute_config: {
                    selected_time_window: -1 
                }
            });
        } catch (err) {
            console.error("[StreamNotifier] Kategori susturulurken hata:", err);
        }
    }

    unmuteCategory(force = false) {
        
        if (!this.SettingsUtils) {
            this.SettingsUtils = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byProps("updateChannelOverrideSettings"));
            if (!this.SettingsUtils) return console.error("[StreamNotifier HATA] SettingsUtils modülü yüklenemedi.");
        }
        
        this.log("Kategori Susturması Kaldırılıyor (Native)...");
        try {
            this.SettingsUtils.updateChannelOverrideSettings(this.targetGuildId, this.targetCategoryId, {
                muted: false,
                mute_config: null
            });
        } catch (err) {
            console.error("[StreamNotifier] Kategori susturması kaldırılırken hata:", err);
        }
    }

    checkSelfStreamState() {
        if (!this.UserStore || !this.VoiceStateStore) {
            console.error("[StreamNotifier HATA] Gerekli modüller (UserStore veya VoiceStateStore) yüklenemedi. Kontrol atlanıyor.");
            return;
        }

        const currentUserId = this.UserStore.getCurrentUser()?.id;
        if (!currentUserId) return;

        const selfVoiceState = this.VoiceStateStore.getVoiceStateForUser(currentUserId);
        const isSelfStreaming = selfVoiceState?.selfStream === true;

        const shouldBeActive = isSelfStreaming;
        const settingActive = this.settings.enableChannelHiding;

        this.log(`Kendi yayın durumu kontrol ediliyor: Yayın AÇIK: ${isSelfStreaming}, Kanal Gizleme Ayarı AÇIK: ${settingActive}, Manuel Gizleme (Kısayol): ${this.isManuallyHidden}, Şu Anki Gizleme Durumu: ${this.isCurrentlyActive}`);
        
        if (shouldBeActive && settingActive && !this.isManuallyHidden) {
            if (!this.isCurrentlyActive) {
                this.log("Yayın başladı ve ayar aktif. Gizleme ve Susturma uygulanıyor.");
                this.applyHidingCSS();
                this.muteCategory();
                this.isCurrentlyActive = true;
            } else {
                this.log("Yayın hala devam ediyor, gizleme zaten aktif.");
            }
        } 
        else {
            if (this.isCurrentlyActive) {
                this.log("Yayın bitti, ayar kapatıldı veya kısayol ile gizleme durduruldu. Gizleme ve Susturma kaldırılıyor.");
                this.removeHidingCSS();
                this.unmuteCategory();
                this.isCurrentlyActive = false;
            }
        }
    }

    handleVoiceStateUpdates = (payload) => {
        if (!this.UserStore) {
            this.UserStore = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStoreName("UserStore"));
        }
        if (!this.VoiceStateStore) {
            this.VoiceStateStore = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStoreName("VoiceStateStore"));
        }
        
        const blacklistedGuilds = this.settings.blacklistedGuilds
            .split(',')
            .map(id => id.trim())
            .filter(Boolean);
        const blacklistedChannels = this.settings.blacklistedChannels
            .split(',')
            .map(id => id.trim())
            .filter(Boolean);

        if (this.UserStore && payload.voiceStates) {
            for (const voiceState of payload.voiceStates) {
                const { userId, selfStream, guildId, channelId } = voiceState;
                
                if (blacklistedGuilds.includes(guildId)) continue;
                if (blacklistedChannels.includes(channelId)) continue; 
                if (!userId) continue;
                
                const user = this.UserStore.getUser(userId);
                if (!user || user.bot) continue;
                
                const isCurrentlyStreaming = this.streamingUsers.has(userId);
                
                if (selfStream && !isCurrentlyStreaming) {
                    this.streamingUsers.add(userId);
                    this.log(`Kullanıcı yayına başladı: ${user.username}`);
                    if (this.settings.enableWebhookNotifications) {
                        const message = this.settings.msgStreamStart.replace("%user%", user.username);
                        this.sendWebhook(message, false, true);
                    }
                }
                else if (!selfStream && isCurrentlyStreaming) {
                    this.streamingUsers.delete(userId);
                    this.log(`Kullanıcı yayınını kapattı: ${user.username}`);
                    if (this.settings.enableWebhookNotifications) {
                        const message = this.settings.msgStreamStop.replace("%user%", user.username);
                        this.sendWebhook(message, false, true);
                    }
                }
            }
        }
        
        this.checkSelfStreamState();
    };

    sendStopMessage(isUnloading = false) {
        if (this.isStopping) return;
        this.isStopping = true;
        if (!this.UserStore) {
            this.UserStore = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStoreName("UserStore"));
        }
        this.log("Kapanış mesajı gönderiliyor...");
        try {
            const currentUser = this.UserStore?.getCurrentUser();
            let message;
            if (currentUser) {
                message = this.settings.msgStop.replace("%user%", currentUser.username);
                this.sendWebhook(message, isUnloading, false);
            } else {
                message = "Eklenti durduruldu. ❌";
                this.sendWebhook(message, isUnloading, false);
            }
        } catch (error) {
            console.error("[StreamNotifier] Kapanış mesajı gönderilirken hata:", error);
        }
    }
    
    handleUnload = () => {
        this.sendStopMessage(true);
    };

    start() {
        this.isStopping = false;
        
        this.loadSettings();
        
        try {
            setTimeout(() => {
                if (!this.UserStore) this.UserStore = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStoreName("UserStore"));
                if (this.UserStore) {
                    const currentUser = this.UserStore.getCurrentUser();
                    if (currentUser && this.settings.enableWebhookNotifications) {
                        const message = this.settings.msgStart.replace("%user%", currentUser.username);
                        this.sendWebhook(message, false, false);
                    }
                }
            }, 3000); 
        } catch (error) {
            console.error("[StreamNotifier] Başlangıç mesajı gönderilirken hata:", error);
        }

        const Dispatcher = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byProps("dispatch", "subscribe"));
        if (Dispatcher) {
            Dispatcher.subscribe('VOICE_STATE_UPDATES', this.handleVoiceStateUpdates);
        }
        
        window.addEventListener('beforeunload', this.handleUnload);
        document.addEventListener("keydown", this.handleKeydown);
        
        this.removeHidingCSS(); 
        this.unmuteCategory(true); 
        this.isCurrentlyActive = false;
        this.isManuallyHidden = false; 
        this.hidingCSS = null;

        if (!this.UserStore) this.UserStore = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStoreName("UserStore"));
        if (!this.VoiceStateStore) this.VoiceStateStore = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStoreName("VoiceStateStore"));

        setTimeout(() => this.checkSelfStreamState(), 2000);
    }

    stop() {
        this.sendStopMessage(false);

        const Dispatcher = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byProps("dispatch", "subscribe"));
        if (Dispatcher) {
            Dispatcher.unsubscribe('VOICE_STATE_UPDATES', this.handleVoiceStateUpdates);
        }
        
        window.removeEventListener('beforeunload', this.handleUnload);
        document.removeEventListener("keydown", this.handleKeydown);
        
        this.removeHidingCSS(); 
        this.unmuteCategory(true); 
        
        this.streamingUsers.clear();
        this.isCurrentlyActive = false;
        this.isManuallyHidden = false;
        this.hidingCSS = null;
    }
};