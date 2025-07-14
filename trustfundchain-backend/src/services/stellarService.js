const StellarSdk = require('stellar-sdk');

class StellarService {
    constructor() {
        this.server = null;
        this.networkPassphrase = null;
        this.isInitialized = false;
        this.isTestnet = process.env.STELLAR_NETWORK === 'testnet';
    }

    // Inicializar servicio con fallback robusto
    async initialize() {
        try {
            console.log('🔄 Inicializando StellarService...');
            
            // Intentar cargar configuración
            try {
                const stellarConfig = require('../config/stellar');
                this.server = stellarConfig.getServer();
                this.networkPassphrase = stellarConfig.getNetworkPassphrase();
                console.log('✅ Configuración cargada desde stellar config');
            } catch (configError) {
                console.log('⚠️ Config no disponible, usando configuración directa');
                
                // Configuración directa como fallback
                if (this.isTestnet) {
                    this.server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
                    this.networkPassphrase = StellarSdk.Networks.TESTNET;
                } else {
                    this.server = new StellarSdk.Server('https://horizon.stellar.org');
                    this.networkPassphrase = StellarSdk.Networks.PUBLIC;
                }
            }
            
            // Verificar conexión
            await this.testConnection();
            
            this.isInitialized = true;
            console.log('✅ StellarService inicializado correctamente');
            return true;
            
        } catch (error) {
            console.error('❌ Error inicializando StellarService:', error);
            this.isInitialized = false;
            return false;
        }
    }

    // Probar conexión con Stellar
    async testConnection() {
        try {
            console.log('🔄 Probando conexión con Stellar...');
            const ledger = await this.server.ledgers().order('desc').limit(1).call();
            console.log('✅ Conexión exitosa, último ledger:', ledger.records[0].sequence);
            return true;
        } catch (error) {
            console.error('❌ Error de conexión con Stellar:', error);
            throw new Error('No se pudo conectar con Stellar Horizon');
        }
    }

    // Crear cuenta real para identidad
    async createIdentityAccount() {
        try {
            console.log('🔄 Creando nueva cuenta Stellar...');
            
            // Verificar que el servicio esté inicializado
            if (!this.isInitialized) {
                const initialized = await this.initialize();
                if (!initialized) {
                    throw new Error('No se pudo inicializar el servicio Stellar');
                }
            }

            // Generar nuevo keypair
            const newKeypair = StellarSdk.Keypair.random();
            
            console.log('🔑 Keypair generado:', {
                publicKey: newKeypair.publicKey(),
                secretKey: newKeypair.secret().substring(0, 10) + '...' // Solo mostrar parte por seguridad
            });

            // Verificar que las claves sean válidas
            if (!StellarSdk.StrKey.isValidEd25519PublicKey(newKeypair.publicKey())) {
                throw new Error('Clave pública generada no es válida');
            }

            if (!StellarSdk.StrKey.isValidEd25519SecretKey(newKeypair.secret())) {
                throw new Error('Clave secreta generada no es válida');
            }

            // Fondear cuenta en testnet usando friendbot
            if (this.isTestnet) {
                console.log('💰 Fondeando cuenta en testnet...');
                await this.fundAccountWithFriendbot(newKeypair.publicKey());
                
                // Esperar a que la cuenta esté disponible
                await this.waitForAccountCreation(newKeypair.publicKey());
                
                // Configurar cuenta con datos adicionales
                await this.setupIdentityAccount(newKeypair);
            } else {
                console.log('⚠️ Mainnet detectado - cuenta creada pero no fondeada');
            }

            console.log('✅ Cuenta Stellar creada exitosamente:', newKeypair.publicKey());

            return {
                publicKey: newKeypair.publicKey(),
                secretKey: newKeypair.secret(),
                did: `did:stellar:${newKeypair.publicKey()}`,
                network: this.isTestnet ? 'testnet' : 'mainnet'
            };

        } catch (error) {
            console.error('❌ Error creando cuenta Stellar:', error);
            throw new Error(`Error creando cuenta Stellar: ${error.message}`);
        }
    }

    // Fondear cuenta usando friendbot (mejorado)
    async fundAccountWithFriendbot(publicKey) {
        try {
            console.log('🤖 Usando friendbot para fondear:', publicKey);
            
            const friendbotUrl = `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`;
            
            // Usar fetch nativo de Node.js
            const response = await fetch(friendbotUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 segundos timeout
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Friendbot error: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Cuenta fondeada por friendbot');
            console.log('📊 Hash de transacción:', result.hash);
            
            return result;
            
        } catch (error) {
            console.error('❌ Error con friendbot:', error);
            
            // Intentar método alternativo
            try {
                console.log('🔄 Intentando método alternativo de fondeo...');
                const alternativeUrl = `https://horizon-testnet.stellar.org/friendbot?addr=${publicKey}`;
                const altResponse = await fetch(alternativeUrl);
                
                if (altResponse.ok) {
                    const altResult = await altResponse.json();
                    console.log('✅ Cuenta fondeada con método alternativo');
                    return altResult;
                }
            } catch (altError) {
                console.error('❌ Método alternativo también falló:', altError);
            }
            
            throw error;
        }
    }

    // Esperar a que la cuenta esté disponible (mejorado)
    async waitForAccountCreation(publicKey, maxAttempts = 15) {
        console.log('⏳ Esperando que la cuenta esté disponible...');
        
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const account = await this.server.loadAccount(publicKey);
                console.log('✅ Cuenta disponible:', account.id);
                console.log('💰 Balance inicial:', account.balances[0]?.balance || '0', 'XLM');
                return account;
            } catch (error) {
                if (i === maxAttempts - 1) {
                    throw new Error(`Cuenta no disponible después de ${maxAttempts} intentos`);
                }
                console.log(`⏳ Intento ${i + 1}/${maxAttempts} - Esperando 3 segundos...`);
                await new Promise(resolve => setTimeout(resolve, 3000)); // Esperar 3 segundos
            }
        }
    }

    // Configurar cuenta de identidad con metadata (mejorado)
    async setupIdentityAccount(keypair) {
        try {
            console.log('⚙️ Configurando cuenta de identidad...');
            
            const account = await this.server.loadAccount(keypair.publicKey());
            
            const transaction = new StellarSdk.TransactionBuilder(account, {
                fee: StellarSdk.BASE_FEE * 10, // Fee más alto para asegurar procesamiento
                networkPassphrase: this.networkPassphrase,
            })
            .addOperation(StellarSdk.Operation.manageData({
                name: 'trustfundchain',
                value: 'identity_account'
            }))
            .addOperation(StellarSdk.Operation.manageData({
                name: 'created_at',
                value: new Date().toISOString().substring(0, 19) // Truncar para evitar límite de 64 bytes
            }))
            .addOperation(StellarSdk.Operation.manageData({
                name: 'version',
                value: '1.0.0'
            }))
            .addOperation(StellarSdk.Operation.manageData({
                name: 'type',
                value: 'identity'
            }))
            .setTimeout(60) // Timeout más largo
            .build();

            transaction.sign(keypair);
            const result = await this.server.submitTransaction(transaction);
            
            console.log('✅ Cuenta de identidad configurada');
            console.log('📊 Hash de configuración:', result.hash);
            return result;
            
        } catch (error) {
            console.error('⚠️ Error configurando cuenta (continuando):', error.message);
            // No lanzar error, la cuenta básica ya está creada
            return null;
        }
    }

    // Enviar pago real (mejorado)
    async sendPayment(sourceSecret, destinationPublicKey, amount, memo = null) {
        try {
            console.log('💸 Enviando pago:', { 
                destination: destinationPublicKey, 
                amount, 
                memo: memo ? memo.substring(0, 20) + '...' : 'sin memo'
            });
            
            // Validar claves
            if (!StellarSdk.StrKey.isValidEd25519SecretKey(sourceSecret)) {
                throw new Error('Clave secreta de origen no válida');
            }
            
            if (!StellarSdk.StrKey.isValidEd25519PublicKey(destinationPublicKey)) {
                throw new Error('Clave pública de destino no válida');
            }
            
            const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecret);
            const sourceAccount = await this.server.loadAccount(sourceKeypair.publicKey());

            const transactionBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
                fee: StellarSdk.BASE_FEE * 10,
                networkPassphrase: this.networkPassphrase,
            });

            // Agregar operación de pago
            transactionBuilder.addOperation(
                StellarSdk.Operation.payment({
                    destination: destinationPublicKey,
                    asset: StellarSdk.Asset.native(),
                    amount: amount.toString(),
                })
            );

            // Agregar memo si se proporciona
            if (memo) {
                const truncatedMemo = memo.length > 28 ? memo.substring(0, 28) : memo;
                transactionBuilder.addMemo(StellarSdk.Memo.text(truncatedMemo));
            }

            const transaction = transactionBuilder.setTimeout(60).build();
            transaction.sign(sourceKeypair);

            const result = await this.server.submitTransaction(transaction);
            
            console.log('✅ Pago enviado exitosamente:', result.hash);

            return {
                hash: result.hash,
                ledger: result.ledger,
                successful: result.successful,
                amount,
                destination: destinationPublicKey,
                memo: memo,
                stellarExplorer: `https://stellar.expert/explorer/${this.isTestnet ? 'testnet' : 'public'}/tx/${result.hash}`
            };

        } catch (error) {
            console.error('❌ Error enviando pago:', error);
            throw new Error(`Error enviando pago: ${error.message}`);
        }
    }

    // Obtener información de cuenta (mejorado)
    async getAccountInfo(publicKey) {
        try {
            // Validar clave pública
            if (!StellarSdk.StrKey.isValidEd25519PublicKey(publicKey)) {
                throw new Error('Clave pública no válida');
            }
            
            const account = await this.server.loadAccount(publicKey);
            
            return {
                id: account.id,
                sequence: account.sequence,
                balances: account.balances,
                signers: account.signers,
                data: account.data_attr,
                flags: account.flags,
                thresholds: account.thresholds,
                stellarExplorer: `https://stellar.expert/explorer/${this.isTestnet ? 'testnet' : 'public'}/account/${publicKey}`
            };
        } catch (error) {
            throw new Error(`Error obteniendo información de cuenta: ${error.message}`);
        }
    }

    // Obtener transacciones reales de una cuenta (mejorado)
    async getAccountTransactions(publicKey, limit = 50) {
        try {
            console.log('📊 Obteniendo transacciones de:', publicKey);
            
            // Validar clave pública
            if (!StellarSdk.StrKey.isValidEd25519PublicKey(publicKey)) {
                throw new Error('Clave pública no válida');
            }
            
            const transactions = await this.server
                .transactions()
                .forAccount(publicKey)
                .order('desc')
                .limit(limit)
                .call();

            const processedTransactions = [];

            for (const tx of transactions.records) {
                try {
                    const operations = await tx.operations();
                    
                    for (const op of operations.records) {
                        if (op.type === 'payment') {
                            processedTransactions.push({
                                id: tx.id,
                                hash: tx.hash,
                                ledger: tx.ledger_attr,
                                created_at: tx.created_at,
                                source_account: tx.source_account,
                                fee_charged: tx.fee_charged,
                                operation_count: tx.operation_count,
                                memo: tx.memo,
                                // Datos de la operación de pago
                                from: op.from,
                                to: op.to,
                                amount: op.amount,
                                asset_type: op.asset_type,
                                transaction_successful: tx.successful,
                                stellarExplorer: `https://stellar.expert/explorer/${this.isTestnet ? 'testnet' : 'public'}/tx/${tx.hash}`
                            });
                        }
                    }
                } catch (opError) {
                    console.error('Error procesando operación:', opError);
                }
            }

            return processedTransactions;

        } catch (error) {
            console.error('❌ Error obteniendo transacciones:', error);
            throw new Error(`Error obteniendo transacciones: ${error.message}`);
        }
    }

    // Verificar si una transacción existe (mejorado)
    async verifyTransaction(txHash) {
        try {
            const transaction = await this.server.transactions().transaction(txHash).call();
            return {
                exists: true,
                successful: transaction.successful,
                ledger: transaction.ledger_attr,
                created_at: transaction.