// Table RPE → pourcentage (rpe*10 simplifié)
export function rpeToPercent(rpe) {
  return rpe / 10
}

// Calcul 1RM via Epley : charge * (1 + reps/30)
export function calcOneRM(charge, reps) {
  if (reps === 1) return charge
  return Math.round(charge * (1 + reps / 30))
}

/*
  Charge prédicte selon priorité :
  1. Si 1RM direct existe pour l'exercice → charge = rpe/10 * 1RM
  2. Si ratio existe (mvt adapté) → charge = rpe/10 * ratio * 1RM_mvt_roi
  3. Sinon → retourne null (on affiche juste "RPE X")

  maxTestes = { "Squat": 150, "DC": 120, ... }
  ratios = { "Split squat bulgare": { ratio: 0.6, mvtRoi: "Squat" }, ... }
*/
export function chargePredicte(exercice, rpe, nbReps, maxTestes = {}, ratios = {}, intensityUnit = 'RPE') {
  let pct = 0
  const val = parseFloat(rpe)
  if (!val) return null

  if (intensityUnit === '%' || intensityUnit === 'PCT') {
    pct = val / 100
  } else if (intensityUnit === 'VITESSE') {
    let pctVal = Math.round(100 - ((val - 0.2) / (1.3 - 0.2)) * 70)
    pctVal = Math.max(10, Math.min(100, pctVal))
    pct = pctVal / 100
  } else {
    pct = val / 10
  }

  // Cas 1 : 1RM direct (recherche totalement insensible à la casse et aux espaces)
  const exoLower = (exercice || '').toLowerCase().trim()
  let oneRM = null
  for (const [key, val] of Object.entries(maxTestes || {})) {
    if (key.toLowerCase().trim() === exoLower) {
      oneRM = parseFloat(val)
      break
    }
  }
  if (oneRM && oneRM > 0) {
    const charge = pct * oneRM
    return arrondir(charge)
  }

  // Cas 2 : ratio via mvt roi
  if (ratios) {
    const ratioData = ratios[exercice]
    if (ratioData) {
      const { ratio, mvtRoi } = ratioData
      const mvtRoiLower = (mvtRoi || '').toLowerCase().trim()
      let oneRMMvtRoi = null
      for (const [key, val] of Object.entries(maxTestes || {})) {
        if (key.toLowerCase().trim() === mvtRoiLower) {
          oneRMMvtRoi = parseFloat(val)
          break
        }
      }
      if (oneRMMvtRoi && oneRMMvtRoi > 0) {
        const charge = pct * ratio * oneRMMvtRoi
        return arrondir(charge)
      }
    }

    // Cas 2b : ratio via format Firestore "cible_vs_tested" (objet ou tableau)
    const nomLower = (exercice || '').toLowerCase().trim()
    if (Array.isArray(ratios)) {
      for (const r of ratios) {
        if (r && r.cible && (r.cible.toLowerCase().trim() === nomLower)) {
          const tested = (r.tested || '').toLowerCase().trim()
          let testMax = null
          for (const [key, val] of Object.entries(maxTestes || {})) {
            if (key.toLowerCase().trim() === tested) {
              testMax = parseFloat(val)
              break
            }
          }
          if (testMax && testMax > 0) {
            const charge = pct * (parseFloat(r.ratio) || 0) * testMax
            return arrondir(charge)
          }
        }
      }
    } else if (typeof ratios === 'object' && ratios !== null) {
      for (const [key, valRatio] of Object.entries(ratios)) {
        const match = key.match(/^(.+)_vs_(.+)$/)
        if (!match) continue
        const cible = match[1].toLowerCase().trim()
        const tested = match[2].toLowerCase().trim()
        if (cible === nomLower) {
          let testMax = null
          for (const [k, val] of Object.entries(maxTestes || {})) {
            if (k.toLowerCase().trim() === tested) {
              testMax = parseFloat(val)
              break
            }
          }
          if (testMax && testMax > 0) {
            const charge = pct * valRatio * testMax
            return arrondir(charge)
          }
        }
      }
    }
  }

  // Cas 3 : aucune référence
  return null
}

// Arrondi au 2.5kg le plus proche
function arrondir(charge) {
  return Math.round(charge / 2.5) * 2.5
}

// Calcul spécifique pour preview % : si intensityUnit est '%', calcule le kg correspondant
// Retourne null si pas de 1RM trouvé ou si unité n'est pas '%'
export function chargePreviewPct(exercice, pct, maxTestes = {}, ratios = {}) {
  if (!pct || pct <= 0) return null
  
  // Chercher 1RM direct
  const exoLower = (exercice || '').toLowerCase().trim()
  let oneRM = null
  for (const [key, val] of Object.entries(maxTestes || {})) {
    if (key.toLowerCase().trim() === exoLower) {
      oneRM = parseFloat(val)
      break
    }
  }
  
  // Si pas de 1RM direct, chercher via ratio
  if (!oneRM && ratios) {
    const ratioData = ratios[exercice]
    if (ratioData) {
      const { ratio, mvtRoi } = ratioData
      const mvtRoiLower = (mvtRoi || '').toLowerCase().trim()
      let oneRMMvtRoi = null
      for (const [key, val] of Object.entries(maxTestes || {})) {
        if (key.toLowerCase().trim() === mvtRoiLower) {
          oneRMMvtRoi = parseFloat(val)
          break
        }
      }
      if (oneRMMvtRoi && oneRMMvtRoi > 0) {
        oneRM = oneRMMvtRoi * ratio
      }
    }
    
    // Si toujours pas de 1RM, essayer avec le format Firestore "cible_vs_tested" (objet ou tableau)
    if (!oneRM) {
      const nomLower = (exercice || '').toLowerCase().trim()
      if (Array.isArray(ratios)) {
        for (const r of ratios) {
          if (r && r.cible && (r.cible.toLowerCase().trim() === nomLower)) {
            const tested = (r.tested || '').toLowerCase().trim()
            let testMax = null
            for (const [key, val] of Object.entries(maxTestes || {})) {
              if (key.toLowerCase().trim() === tested) {
                testMax = parseFloat(val)
                break
              }
            }
            if (testMax && testMax > 0) {
              oneRM = testMax * (parseFloat(r.ratio) || 0)
              break
            }
          }
        }
      } else if (typeof ratios === 'object' && ratios !== null) {
        for (const [key, val] of Object.entries(ratios)) {
          const match = key.match(/^(.+)_vs_(.+)$/)
          if (!match) continue
          const cible = match[1].toLowerCase().trim()
          const tested = match[2].toLowerCase().trim()
          if (cible === nomLower) {
            let testMax = null
            for (const [k, val] of Object.entries(maxTestes || {})) {
              if (k.toLowerCase().trim() === tested) {
                testMax = parseFloat(val)
                break
              }
            }
            if (testMax && testMax > 0) {
              oneRM = testMax * val
              break
            }
          }
        }
      }
    }
  }
  
  if (!oneRM || oneRM <= 0) return null
  
  // Calcul : pct% du 1RM
  const charge = (pct / 100) * oneRM
  return arrondir(charge)
}

// Label affiché dans la vue
export function labelCharge(exercice, rpe, nbReps, maxTestes = {}, ratios = {}, intensityUnit = 'RPE') {
  const c = chargePredicte(exercice, rpe, nbReps, maxTestes, ratios, intensityUnit)
  if (c !== null) return c + ' kg'
  
  if (intensityUnit === 'PCT' || intensityUnit === '%') {
    return rpe + '%'
  } else if (intensityUnit === 'VITESSE') {
    return rpe + ' m/s'
  }
  return 'RPE ' + rpe
}

/*
  Charge preview avancée avec :
  1. Max sur les 2 derniers mois depuis dataPerf
  2. Si cycle défini : charge la plus récente dans ce cycle
  3. Ratio d'évolution : comparaison objectif actuel vs charge précédente

  Retourne : { chargeCalculee, chargeReference, evolutionPct, source }
  - chargeCalculee : kg basé sur le % du 1RM (objectif)
  - chargeReference : dernière charge réalisée (max 2mois ou dans cycle)
  - evolutionPct : pourcentage d'évolution (+5%, -3%, etc.)
  - source : '2mois' | 'cycle' | '1rm' | null
*/
export function chargePreviewAdvanced(exercice, pct, maxTestes = {}, dataPerf = [], cycles = [], cycleId = null, seanceDate = null, ratios = {}) {
  if (!pct || pct <= 0) return null

  // 1. Calculer la charge théorique (objectif) basée sur le 1RM
  let chargeCalculee = chargePreviewPct(exercice, pct, maxTestes, ratios)
  let chargeReference = null
  let source = null

  // 2. Chercher le max sur les 2 derniers mois dans dataPerf
  const deuxMoisAvant = new Date()
  deuxMoisAvant.setMonth(deuxMoisAvant.getMonth() - 2)
  const dateLimite = deuxMoisAvant.toISOString().split('T')[0]

  const perfsRecentes = dataPerf.filter(p =>
    p.exercice?.toLowerCase() === exercice?.toLowerCase() &&
    p.charge > 0 &&
    p.date >= dateLimite &&
    (seanceDate ? p.date < seanceDate : true)
  )

  if (perfsRecentes.length > 0) {
    // Max sur les 2 derniers mois
    chargeReference = Math.max(...perfsRecentes.map(p => p.charge))
    source = '2mois'
  }

  // 3. Si on est dans un cycle, chercher la charge la plus récente DANS ce cycle
  if (cycleId && cycles.length > 0) {
    const cycle = cycles.find(c => c.id === cycleId)
    if (cycle && cycle.dateDebut) {
      const debutCycle = cycle.dateDebut
      // Calculer la fin du cycle (dateDebut + nbSemaines * 7 jours)
      const finCycle = cycle.dateFin || (() => {
        const d = new Date(cycle.dateDebut)
        d.setDate(d.getDate() + (cycle.nbSemaines || 4) * 7)
        return d.toISOString().split('T')[0]
      })()

      const perfsDansCycle = dataPerf.filter(p =>
        p.exercice?.toLowerCase() === exercice?.toLowerCase() &&
        p.charge > 0 &&
        p.date >= debutCycle &&
        p.date <= finCycle &&
        (seanceDate ? p.date < seanceDate : true)
      ).sort((a, b) => (b.date || '').localeCompare(a.date || ''))

      if (perfsDansCycle.length > 0) {
        // La plus récente dans le cycle
        chargeReference = perfsDansCycle[0].charge
        source = 'cycle'
      }
    }
  }

  // 4. Calculer le ratio d'évolution
  let evolutionPct = null
  if (chargeCalculee !== null && chargeReference !== null && chargeReference > 0) {
    evolutionPct = Math.round(((chargeCalculee - chargeReference) / chargeReference) * 100)
  }

  return {
    chargeCalculee,
    chargeReference,
    evolutionPct,
    source
  }
}

// Score wellness global
export function calcWellnessScore(hooper, sommeil, tapCount, refTap = 70) {
  if (!hooper || Object.keys(hooper).length === 0) return null
  const vals = Object.values(hooper)
  const hooperMoy = vals.reduce((a, b) => a + b, 0) / vals.length
  const sommeilScore = sommeil ? Math.min((sommeil / 8) * 7, 7) : hooperMoy
  const tapScore = tapCount ? Math.min((tapCount / refTap) * 7, 7) : hooperMoy
  return parseFloat(((hooperMoy * 0.5) + (sommeilScore * 0.3) + (tapScore * 0.2)).toFixed(2))
}

// Détection variation brutale > 1.5 écart-type sur 7 jours
export function detectVariation(historique, scoreAujourdhui) {
  if (!historique || historique.length < 3) return false
  const vals = historique.slice(-7).map(h => h.score).filter(v => v != null)
  if (vals.length < 3) return false
  const moy = vals.reduce((a, b) => a + b, 0) / vals.length
  const sd = Math.sqrt(vals.reduce((a, b) => a + Math.pow(b - moy, 2), 0) / vals.length)
  if (sd === 0) return false
  return Math.abs(scoreAujourdhui - moy) > 1.5 * sd
}
