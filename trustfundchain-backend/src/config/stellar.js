const StellarSdk = require('stellar-sdk');

class StellarConfig {
    constructor() {
        this.server = null;
        this.networkPassphrase = null;
        this.masterKeypair = null;
        this.isTestnet = process.env.STELLAR_NETWORK === 'testnet';
    }

    async initialize() {
        try {
            console.log('🚀 Inicializando configuración Stellar...');
            
            // Configurar red
            if (this.isTestnet) {
                this.server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
                this.networkPassphrase = StellarSdk.Networks.TESTNET;
                console.log('🌐 Conectado a Stellar Testnet');
            } else {
                this.server = new StellarSdk.Server('https://horizon.stellar.org');
                this.networkPassphrase = StellarSdk.Networks.PUBLIC;
                console.log('🌐 Conectado a Stellar Mainnet');
            }

            // Crear o cargar cuenta maestra
            await this.setupMasterAccount();
            
            return true;
        } catch (error) {
            console.error('❌ Error configurando Stellar:', error);
            return false;
        }
    }

    async setupMasterAccount() {
        try {
            // Si no hay clave maestra, crear una nueva
            if (!process.env.MASTER_SECRET_KEY) {
                this.masterKeypair = StellarSdk.Keypair.random();
                console.log('🔑 Nueva cuenta maestra creada:');
                console.log('Public Key:', this.masterKeypair.publicKey());
                console.log('Secret Key:', this.masterKeypair.secret());
                console.log('⚠️  GUARDA ESTAS CLAVES EN TU .env');
                
                // Fondear en testnet
                if (this.isTestnet) {
                    await this.fundAccount(this.masterKeypair.publicKey());
                }
            } else {
                // Validar clave existente
                if (!StellarSdk.StrKey.isValidEd25519SecretKey(process.env.MASTER_SECRET_KEY)) {
                    throw new Error('MASTER_SECRET_KEY no es válida');
                }
                
                this.masterKeypair = StellarSdk.Keypair.fromSecret(process.env.MASTER_SECRET_KEY);
                console.log('🔑 Usando cuenta maestra existente:', this.masterKeypair.publicKey());
            }

            // Verificar cuenta
            try {
                const account = await this.server.loadAccount(this.masterKeypair.publicKey());
                console.log('✅ Cuenta maestra verificada:', this.masterKeypair.publicKey());
                console.log('💰 Balance:', account.balances[0].balance, 'XLM');
            } catch (accountError) {
                if (this.isTestnet) {
                    console.log('⚠️ Cuenta maestra no encontrada, fondeando...');
                    await this.fundAccount(this.masterKeypair.publicKey());
                } else {
                    throw new Error('Cuenta maestra no existe en mainnet');
                }
            }

        } catch (error) {
            console.error('❌ Error configurando cuenta maestra:', error);
            throw error;
        }
    }

    async fundAccount(publicKey) {
        try {
            if (!this.isTestnet) return;
            
            console.log('💰 Fondeando cuenta en testnet:', publicKey);
            const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
            
            if (!response.ok) {
                throw new Error('Error fondeando cuenta');
            }
            
            console.log('✅ Cuenta fondeada exitosamente');
        } catch (error) {
            console.error('❌ Error fondeando cuenta:', error);
        }
    }

    getServer() { 
        return this.server; 
    }
    
    getNetworkPassphrase() { 
        return this.networkPassphrase; 
    }
    
    getMasterKeypair() { 
        return this.masterKeypair; 
    }
}

module.exports = new StellarConfig();
