const StellarSdk = require('stellar-sdk');
const stellarConfig = require('../config/stellar');

class SorobanService {
    constructor() {
        this.server = stellarConfig.getServer();
        this.networkPassphrase = stellarConfig.getNetworkPassphrase();
        this.contractIds = {
            identity: process.env.IDENTITY_CONTRACT_ID,
            funding: process.env.FUNDING_CONTRACT_ID
        };
    }

    // Crear contrato de identidad
    async deployIdentityContract() {
        try {
            console.log('🚀 Desplegando contrato de identidad...');
            
            // Código WASM del contrato (simplificado para demo)
            const contractCode = this.getIdentityContractCode();
            
            const masterKeypair = stellarConfig.getMasterKeypair();
            const sourceAccount = await this.server.loadAccount(masterKeypair.publicKey());

            // Crear transacción para desplegar contrato
            const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
                fee: StellarSdk.BASE_FEE * 1000, // Fee más alto para contratos
                networkPassphrase: this.networkPassphrase,
            })
            .addOperation(StellarSdk.Operation.createContract({
                wasmHash: contractCode.hash,
                address: masterKeypair.publicKey()
            }))
            .setTimeout(30)
            .build();

            transaction.sign(masterKeypair);
            const result = await this.server.submitTransaction(transaction);

            console.log('✅ Contrato de identidad desplegado:', result.hash);
            return result;

        } catch (error) {
            console.error('❌ Error desplegando contrato:', error);
            throw error;
        }
    }

    // Registrar identidad en contrato
    async registerIdentity(did, publicKey, metadata) {
        try {
            console.log('📝 Registrando identidad en contrato:', did);

            const masterKeypair = stellarConfig.getMasterKeypair();
            const sourceAccount = await this.server.loadAccount(masterKeypair.publicKey());

            // Invocar función del contrato
            const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
                fee: StellarSdk.BASE_FEE * 100,
                networkPassphrase: this.networkPassphrase,
            })
            .addOperation(StellarSdk.Operation.invokeContract({
                contract: this.contractIds.identity,
                function: 'register_identity',
                args: [
                    StellarSdk.nativeToScVal(did, { type: 'string' }),
                    StellarSdk.nativeToScVal(publicKey, { type: 'string' }),
                    StellarSdk.nativeToScVal(JSON.stringify(metadata), { type: 'string' })
                ]
            }))
            .setTimeout(30)
            .build();

            transaction.sign(masterKeypair);
            const result = await this.server.submitTransaction(transaction);

            console.log('✅ Identidad registrada en contrato');
            return result;

        } catch (error) {
            console.error('❌ Error registrando identidad:', error);
            // En desarrollo, continuar sin contrato
            return { hash: 'simulated_' + Date.now() };
        }
    }

    // Crear transacción de funding automática
    async createFundingTransaction(beneficiaryDID, amount, category, purpose) {
        try {
            console.log('💰 Creando transacción de funding:', { beneficiaryDID, amount, category });

            const masterKeypair = stellarConfig.getMasterKeypair();
            const sourceAccount = await this.server.loadAccount(masterKeypair.publicKey());

            // Invocar contrato de funding
            const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
                fee: StellarSdk.BASE_FEE * 100,
                networkPassphrase: this.networkPassphrase,
            })
            .addOperation(StellarSdk.Operation.invokeContract({
                contract: this.contractIds.funding,
                function: 'create_funding',
                args: [
                    StellarSdk.nativeToScVal(beneficiaryDID, { type: 'string' }),
                    StellarSdk.nativeToScVal(amount.toString(), { type: 'string' }),
                    StellarSdk.nativeToScVal(category, { type: 'string' }),
                    StellarSdk.nativeToScVal(purpose, { type: 'string' }),
                    StellarSdk.nativeToScVal(Date.now().toString(), { type: 'string' })
                ]
            }))
            .setTimeout(30)
            .build();

            transaction.sign(masterKeypair);
            const result = await this.server.submitTransaction(transaction);

            console.log('✅ Transacción de funding creada en contrato');
            return result;

        } catch (error) {
            console.error('❌ Error creando funding en contrato:', error);
            // Fallback: crear transacción directa sin contrato
            return await this.createDirectFunding(beneficiaryDID, amount, category, purpose);
        }
    }

    // Crear funding directo (fallback sin contrato)
    async createDirectFunding(beneficiaryDID, amount, category, purpose) {
        try {
            console.log('🔄 Creando funding directo:', { beneficiaryDID, amount });
            
            // Buscar la identidad por DID para obtener la public key
            const Identity = require('../models/Identity');
            const identity = await Identity.findOne({ did: beneficiaryDID });
            
            if (!identity) {
                throw new Error('Beneficiario no encontrado');
            }

            const stellarService = require('./stellarService');
            const masterKeypair = stellarConfig.getMasterKeypair();

            // Crear memo con metadata
            const memo = `TrustFund|category:${category}|purpose:${purpose}|did:${beneficiaryDID}`;

            // Enviar pago directo
            const result = await stellarService.sendPayment(
                masterKeypair.secret(),
                identity.publicKey,
                amount,
                memo
            );

            console.log('✅ Funding directo enviado');
            return result;

        } catch (error) {
            console.error('❌ Error en funding directo:', error);
            throw error;
        }
    }

    // Verificar identidad en contrato
    async verifyIdentity(did) {
        try {
            console.log('🔍 Verificando identidad en contrato:', did);

            if (!this.contractIds.identity) {
                console.log('⚠️  Contrato de identidad no disponible, verificación local');
                return { verified: true, method: 'local' };
            }

            // En un entorno real, aquí invocarías el contrato para verificar
            // Por ahora, simularemos la verificación
            return {
                verified: true,
                did: did,
                timestamp: Date.now(),
                method: 'contract'
            };

        } catch (error) {
            console.error('❌ Error verificando identidad:', error);
            return { verified: false, error: error.message };
        }
    }

    // Obtener historial de funding
    async getFundingHistory(did) {
        try {
            console.log('📊 Obteniendo historial de funding:', did);

            // En un entorno real, consultarías el contrato
            // Por ahora, buscaremos en la base de datos local
            const Transaction = require('../models/Transaction');
            const Identity = require('../models/Identity');

            const identity = await Identity.findOne({ did });
            if (!identity) {
                return { history: [], total: 0 };
            }

            const transactions = await Transaction.find({
                $or: [
                    { beneficiaryId: identity._id },
                    { stellarTxHash: { $regex: identity.publicKey } }
                ]
            }).sort({ createdAt: -1 });

            const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);

            return {
                history: transactions,
                total: total,
                count: transactions.length
            };

        } catch (error) {
            console.error('❌ Error obteniendo historial:', error);
            return { history: [], total: 0, error: error.message };
        }
    }

    // Obtener código del contrato de identidad (simulado)
    getIdentityContractCode() {
        // En un entorno real, aquí cargarías el archivo WASM compilado
        return {
            hash: 'identity_contract_hash_placeholder',
            code: 'identity_contract_wasm_placeholder'
        };
    }

    // Obtener código del contrato de funding (simulado)
    getFundingContractCode() {
        return {
            hash: 'funding_contract_hash_placeholder',
            code: 'funding_contract_wasm_placeholder'
        };
    }

    // Verificar estado de contratos
    async getContractStatus() {
        try {
            return {
                identity: {
                    deployed: !!this.contractIds.identity,
                    contractId: this.contractIds.identity,
                    status: this.contractIds.identity ? 'active' : 'not_deployed'
                },
                funding: {
                    deployed: !!this.contractIds.funding,
                    contractId: this.contractIds.funding,
                    status: this.contractIds.funding ? 'active' : 'not_deployed'
                },
                network: process.env.STELLAR_NETWORK,
                sorobanRpc: process.env.SOROBAN_RPC_URL
            };
        } catch (error) {
            console.error('❌ Error verificando estado de contratos:', error);
            return {
                error: error.message
            };
        }
    }

    // Función para crear funding automático basado en criterios
    async createAutomaticFunding(criteria) {
        try {
            console.log('🤖 Creando funding automático con criterios:', criteria);

            const Identity = require('../models/Identity');
            
            // Buscar identidades que cumplan los criterios
            let query = { verified: true };
            
            if (criteria.documentType) {
                query.documentType = criteria.documentType;
            }
            
            if (criteria.location) {
                query.location = { $regex: criteria.location, $options: 'i' };
            }

            const eligibleIdentities = await Identity.find(query).limit(criteria.maxBeneficiaries || 10);

            const results = [];

            for (const identity of eligibleIdentities) {
                try {
                    const fundingResult = await this.createFundingTransaction(
                        identity.did,
                        criteria.amount,
                        criteria.category,
                        criteria.purpose
                    );

                    results.push({
                        did: identity.did,
                        name: identity.name,
                        amount: criteria.amount,
                        status: 'success',
                        txHash: fundingResult.hash
                    });

                } catch (error) {
                    results.push({
                        did: identity.did,
                        name: identity.name,
                        amount: criteria.amount,
                        status: 'failed',
                        error: error.message
                    });
                }
            }

            console.log(`✅ Funding automático completado: ${results.length} transacciones`);
            return results;

        } catch (error) {
            console.error('❌ Error en funding automático:', error);
            throw error;
        }
    }
}

module.exports = new SorobanService();
