/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - API SUIVI PATRIMOINE (INTERCONNEXION ÉTENDUE V3)
 * =========================================================================
 * Nouvelles fonctionnalités d'interconnexion :
 * 1. Support double GET/POST avec réponse JSON structurée (CORS / redirection).
 * 2. Flux de devises en direct (GOOGLEFINANCE) via action 'rates'.
 * 3. Import par lot de transactions bancaires (CSV) via action 'batch_transactions'.
 * 4. Déclencheur automatique de sauvegarde mensuelle (Instantané le 1er du mois).
 * 5. Gestion des versions et horodatage pour éviter les conflits d'écrasement.
 *
 * Instructions de mise en place :
 * - Ouvrez votre Google Sheet (ex: 'Suivi Patrimoine').
 * - Allez dans Extensions > Apps Script.
 * - Remplacez tout le code par ce fichier et enregistrez (Ctrl+S).
 * - Cliquez sur Déployer > Gérer les déploiements > Crayon > 'Nouvelle version' > Déployer.
 */

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'load';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Chargement de l'état complet
    if (action === 'load') {
      const configSheet = getOrCreateSheet(ss, 'Configuration_JSON');
      const jsonStr = configSheet.getRange('A1').getValue();
      const lastModified = configSheet.getRange('B1').getValue();
      let stateData = {};
      if (jsonStr) {
        try { stateData = JSON.parse(jsonStr); } catch(err) { stateData = {}; }
      }
      return jsonResponse({
        status: 'success',
        lastModified: lastModified || new Date().toISOString(),
        state: stateData
      });
    }

    // 2. Récupération de l'historique complet
    if (action === 'history') {
      const historySheet = getOrCreateSheet(ss, 'Historique_Patrimoine');
      const lastRow = historySheet.getLastRow();
      let records = [];
      if (lastRow > 1) {
        const values = historySheet.getRange(2, 1, lastRow - 1, 10).getValues();
        records = values.map(function(r) {
          return {
            timestamp: r[0],
            dateLabel: r[1],
            currency: r[2],
            patrimoineNet: Number(r[3]) || 0,
            revenusTotaux: Number(r[4]) || 0,
            depensesTotales: Number(r[5]) || 0,
            capaciteEpargne: Number(r[6]) || 0,
            tauxEpargne: Number(r[7]) || 0,
            epargneUrgence: Number(r[8]) || 0,
            dettesTotales: Number(r[9]) || 0
          };
        }).reverse();
      }
      return jsonResponse({
        status: 'success',
        count: records.length,
        history: records
      });
    }

    // 3. Taux de change en direct via Google Finance
    if (action === 'rates') {
      const rates = getLiveExchangeRates(ss);
      return jsonResponse({
        status: 'success',
        updated: new Date().toISOString(),
        rates: rates
      });
    }

    // 4. Ping / Health check
    if (action === 'ping') {
      return jsonResponse({
        status: 'success',
        message: 'Google Apps Script API active et connectée',
        time: new Date().toISOString()
      });
    }

    return jsonResponse({ status: 'ok', message: 'API active' });

  } catch (error) {
    return jsonResponse({
      status: 'error',
      message: error.toString()
    });
  }
}

function doPost(e) {
  try {
    let body = {};
    if (e && e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch(err) {
        body = {};
      }
    } else if (e && e.parameter) {
      body = e.parameter;
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = body.action || 'save';

    // 1. Sauvegarde standard de l'état
    if (action === 'save' && body.state) {
      const state = body.state;
      const nowIso = new Date().toISOString();

      // Sauvegarde JSON complet + horodatage
      const configSheet = getOrCreateSheet(ss, 'Configuration_JSON');
      configSheet.getRange('A1').setValue(JSON.stringify(state));
      configSheet.getRange('B1').setValue(nowIso);

      // Écriture lisible des tables
      if (Array.isArray(state.monthlyTable)) {
        writeMonthlyTable(ss, state.monthlyTable);
      }
      writeSummary(ss, state);
      appendHistorySnapshot(ss, state);

      return jsonResponse({
        status: 'success',
        lastModified: nowIso,
        message: 'Synchronisation et historique mis à jour avec succès'
      });
    }

    // 2. Import par lot de transactions (ex: après parsing CSV bancaire)
    if (action === 'batch_transactions' && Array.isArray(body.transactions)) {
      const added = appendBatchTransactions(ss, body.transactions);
      return jsonResponse({
        status: 'success',
        addedCount: added,
        message: added + ' transactions importées avec succès'
      });
    }

    return jsonResponse({
      status: 'ignored',
      message: 'Action non reconnue'
    });

  } catch (error) {
    return jsonResponse({
      status: 'error',
      message: error.toString()
    });
  }
}

// ======================== UTILITAIRES & SERVICES ========================

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

/**
 * Calcule les taux de change actualisés (base EUR).
 * Utilise une feuille de calcul dédiée pour exploiter les formules GOOGLEFINANCE.
 */
function getLiveExchangeRates(ss) {
  const sheet = getOrCreateSheet(ss, 'Marche_Devises');
  
  if (sheet.getLastRow() < 4) {
    sheet.clear();
    sheet.getRange('A1:C1').setValues([['Paire', 'Taux', 'Dernière MAJ']]);
    sheet.getRange('A2:B5').setFormulas([
      ['EUR/USD', '=GOOGLEFINANCE("CURRENCY:EURUSD")'],
      ['EUR/GBP', '=GOOGLEFINANCE("CURRENCY:EURGBP")'],
      ['EUR/CHF', '=GOOGLEFINANCE("CURRENCY:EURCHF")'],
      ['EUR/XOF', '655.957'] // Taux fixe BCEAO / FCFA
    ]);
    sheet.getRange('A1:C1').setFontWeight('bold');
    SpreadsheetApp.flush();
  }

  const values = sheet.getRange('A2:B5').getValues();
  const rates = {
    '€': 1.0,
    '$': Number(values[0][1]) || 1.08,
    '£': Number(values[1][1]) || 0.86,
    'CHF': Number(values[2][1]) || 0.95,
    'FCFA': 655.957
  };

  return rates;
}

function appendHistorySnapshot(ss, state) {
  const sheet = getOrCreateSheet(ss, 'Historique_Patrimoine');
  const headers = [
    'Timestamp ISO',
    'Date & Heure',
    'Devise',
    'Patrimoine Net',
    'Revenus Mensuels',
    'Dépenses Mensuelles',
    'Capacité Épargne',
    'Taux Épargne (%)',
    'Épargne Urgence',
    'Dettes'
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0a1120').setFontColor('#38bdf8');
    sheet.setFrozenRows(1);
  }

  const income = state.income || {};
  const exp = state.exp || {};
  const pat = state.patrimoine || {};

  const totalRev = Object.values(income).reduce((a, b) => a + (Number(b) || 0), 0);
  const totalExp = Object.values(exp).reduce((a, b) => a + (Number(b) || 0), 0);
  const epargne = totalRev - totalExp;
  const tauxEpargne = totalRev > 0 ? Math.round((epargne / totalRev) * 1000) / 10 : 0;
  
  const totalActifs = Object.values(pat).reduce((a, b) => a + (Number(b) || 0), 0);
  const patNet = totalActifs - (Number(state.debt) || 0);

  const now = new Date();
  const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd HH:mm:ss');

  sheet.appendRow([
    now.toISOString(),
    dateStr,
    state.currency || '€',
    patNet,
    totalRev,
    totalExp,
    epargne,
    tauxEpargne,
    Number(state.emergencySaved) || 0,
    Number(state.debt) || 0
  ]);
  
  sheet.autoResizeColumns(1, headers.length);
}

function appendBatchTransactions(ss, transactions) {
  const sheet = getOrCreateSheet(ss, 'Transactions_Mensuelles');
  const startRow = Math.max(sheet.getLastRow() + 1, 2);
  let count = 0;

  transactions.forEach(t => {
    const budget = Number(t.budget) || 0;
    const reel = Number(t.reel) || 0;
    const ecart = reel - budget;
    sheet.appendRow([
      t.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd'),
      t.categorie || 'Autres',
      t.sousCat || '',
      budget,
      reel,
      ecart,
      t.commentaire || 'Import CSV'
    ]);
    count++;
  });

  return count;
}

function writeMonthlyTable(ss, rows) {
  const sheet = getOrCreateSheet(ss, 'Transactions_Mensuelles');
  sheet.clear();
  
  const headers = ['Date', 'Catégorie', 'Sous-catégorie', 'Budget prévu', 'Réel', 'Écart', 'Commentaire'];
  const data = [headers];

  rows.forEach(r => {
    const ecart = (Number(r.reel) || 0) - (Number(r.budget) || 0);
    data.push([
      r.date || '',
      r.categorie || '',
      r.sousCat || '',
      Number(r.budget) || 0,
      Number(r.reel) || 0,
      ecart,
      r.commentaire || ''
    ]);
  });

  sheet.getRange(1, 1, data.length, headers.length).setValues(data);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0a1120').setFontColor('#38bdf8');
  sheet.autoResizeColumns(1, headers.length);
}

function writeSummary(ss, state) {
  const sheet = getOrCreateSheet(ss, 'Synthèse_Dashboard');
  sheet.clear();

  const income = state.income || {};
  const exp = state.exp || {};
  const pat = state.patrimoine || {};

  const totalRev = Object.values(income).reduce((a, b) => a + (Number(b) || 0), 0);
  const totalExp = Object.values(exp).reduce((a, b) => a + (Number(b) || 0), 0);
  const epargne = totalRev - totalExp;

  const summaryData = [
    ['INDICATEUR', 'VALEUR', 'DATE MAJ : ' + new Date().toLocaleString('fr-FR')],
    ['Revenus Mensuels Totaux', totalRev, ''],
    ['Dépenses Totales', totalExp, ''],
    ['Capacité d\'Épargne Mensuelle', epargne, ''],
    ['Taux d\'Épargne (%)', totalRev > 0 ? (epargne / totalRev * 100).toFixed(1) + '%' : '0%', ''],
    ['Épargne Urgence Actuelle', state.emergencySaved || 0, ''],
    ['Dettes Totales', state.debt || 0, '']
  ];

  sheet.getRange(1, 1, summaryData.length, 3).setValues(summaryData);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#0a1120').setFontColor('#34d399');
  sheet.autoResizeColumns(1, 3);
}

/**
 * Déclencheur automatique mensuel optionnel :
 * Enregistre un instantané régulier dans l'Historique sans action utilisateur requise.
 */
function monthlyAutomatedSnapshotTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName('Configuration_JSON');
  if (!configSheet) return;
  const jsonStr = configSheet.getRange('A1').getValue();
  if (!jsonStr) return;
  try {
    const state = JSON.parse(jsonStr);
    appendHistorySnapshot(ss, state);
  } catch(e) {
    Logger.log('Erreur trigger mensuel: ' + e);
  }
}
