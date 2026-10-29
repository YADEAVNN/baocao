// modules/efficiency.module.js
window.EfficiencyModule = {
  effPeriodMode: 'MONTH', // 'WEEK' | 'MONTH' | 'CUSTOM'
  effStartDate: '',
  effEndDate: '',
  effRegionFilter: 'ALL',
  effSupervisorFilter: 'ALL',
  activeDrawerSupervisor: null,

  setFilter(key, val) {
    this[key] = val;
    window.App.renderCurrentModule();
  },

  getCurrentWeekRange() {
    if (window.AppUtils && window.AppUtils.getCurrentWeekRange) {
      return window.AppUtils.getCurrentWeekRange();
    }
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diffToMonday));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday.toISOString().slice(0, 10),
      end: sunday.toISOString().slice(0, 10)
    };
  },

  getEfficiencyDateWindow() {
    if (this.effPeriodMode === 'WEEK') {
      const wk = this.getCurrentWeekRange();
      const start = this.effStartDate || wk.start;
      const end = this.effEndDate || wk.end;
      const dStart = new Date(start);
      const prevEnd = new Date(dStart);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - 6);
      return {
        start,
        end,
        prevStart: prevStart.toISOString().slice(0, 10),
        prevEnd: prevEnd.toISOString().slice(0, 10),
        label: `Tuần (${start} → ${end})`
      };
    }

    if (this.effPeriodMode === 'CUSTOM' && this.effStartDate && this.effEndDate) {
      const s = this.effStartDate;
      const e = this.effEndDate;
      const msDiff = Math.max(86400000, new Date(e) - new Date(s));
      const pEnd = new Date(new Date(s).getTime() - 86400000);
      const pStart = new Date(pEnd.getTime() - msDiff);
      return {
        start: s,
        end: e,
        prevStart: pStart.toISOString().slice(0, 10),
        prevEnd: pEnd.toISOString().slice(0, 10),
        label: `Từ ${s} đến ${e}`
      };
    }

    const rawMonth = window.AppState?.month || '2026-09';
    const [yStr, mStr] = rawMonth.split('-');
    const year = parseInt(yStr, 10) || 2026;
    const month = parseInt(mStr, 10) || 9;

    const lastDay = new Date(year, month, 0).getDate();
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const prevM = month > 1 ? month - 1 : 12;
    const prevY = month > 1 ? year : year - 1;
    const prevLastDay = new Date(prevY, prevM, 0).getDate();
    const prevStart = `${prevY}-${String(prevM).padStart(2, '0')}-01`;
    const prevEnd = `${prevY}-${String(prevM).padStart(2, '0')}-${String(prevLastDay).padStart(2, '0')}`;

    return {
      start,
      end,
      prevStart,
      prevEnd,
      label: `Tháng ${String(month).padStart(2, '0')}/${year}`
    };
  },

  setEfficiencyPeriodMode(mode) {
    this.effPeriodMode = mode;
    if (mode === 'WEEK') {
      const wk = this.getCurrentWeekRange();
      this.effStartDate = wk.start;
      this.effEndDate = wk.end;
    } else if (mode === 'MONTH') {
      this.effStartDate = '';
      this.effEndDate = '';
    } else if (mode === 'CUSTOM' && (!this.effStartDate || !this.effEndDate)) {
      const win = this.getEfficiencyDateWindow();
      this.effStartDate = win.start;
      this.effEndDate = win.end;
    }
    window.App.renderCurrentModule();
  },

  setEfficiencyCustomDate(key, val) {
    this.effPeriodMode = 'CUSTOM';
    this[key] = val;
    window.App.renderCurrentModule();
  },

  openSupervisorEfficiencyDrawer(supName) {
    this.activeDrawerSupervisor = supName;
    window.App.renderCurrentModule();
  },

  closeSupervisorEfficiencyDrawer() {
    this.activeDrawerSupervisor = null;
    window.App.renderCurrentModule();
  },

  normalizePersonName(str) {
    if (window.AppUtils && window.AppUtils.normalizePersonName) {
      return window.AppUtils.normalizePersonName(str);
    }
    if (!str) return '';
    return String(str)
      .replace(/[\u4e00-\u9fa5]/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/gi, 'd')
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .trim();
  },

  extractDvnCodes(dvnStr) {
    if (!dvnStr) return [];
    const matches = String(dvnStr).toUpperCase().match(/DVN[A-Z0-9]+/g);
    if (matches && matches.length > 0) {
      return [...new Set(matches.map(m => String(m).trim()))];
    }
    const trimmed = String(dvnStr).trim();
    return trimmed ? [trimmed] : [];
  },

  extractTaskProblems(task) {
    const problems = [];
    const chk = task.checklist || {};
    const failedItems = [];
    if (chk.signboard === false) failedItems.push('Biển hiệu & Mặt tiền chưa đạt');
    if (chk.display === false) failedItems.push('Trưng bày & Bảng giá POP chưa chuẩn');
    if (chk.staff === false) failedItems.push('Tác phong / Kỹ năng tư vấn nhân viên yếu');
    if (chk.inventory === false) failedItems.push('Chênh lệch tồn kho thực tế & Cloud Sale');

    if (failedItems.length > 0) {
      problems.push(failedItems.join('; '));
    }

    const rawIssue = String(task.issues || task.note || '').trim();
    const isDefaultOk =
      !rawIssue ||
      rawIssue.toLowerCase() === 'đạt chuẩn vận hành' ||
      rawIssue.toLowerCase() === 'bình thường';

    const isMarketPlan = task.taskType === 'MARKET_PLAN' || String(task.id).startsWith('PLAN-');
    if (!isDefaultOk && !isMarketPlan) {
      problems.push(rawIssue);
    } else if (isMarketPlan && task.issues && task.issues !== task.note) {
      problems.push(String(task.issues).trim());
    }

    return problems;
  },

  getTaskCompletedDate(task) {
    if (task.status !== 'COMPLETED') return null;
    if (Array.isArray(task.history) && task.history.length > 0) {
      const compEntry = task.history.find(h =>
        String(h.action || '').toLowerCase().includes('hoàn thành') ||
        String(h.action || '').toLowerCase().includes('completed')
      ) || task.history[0];

      if (compEntry.isoDate) return compEntry.isoDate;
      const matchDMY = String(compEntry.time || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (matchDMY) {
        const [, d, m, y] = matchDMY;
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
    return task.deadline || task.startDate || new Date().toISOString().slice(0, 10);
  },

  isTaskOverdue(task) {
    if (!task || !task.deadline) return false;
    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') return false;
    const today = new Date().toISOString().slice(0, 10);
    return String(task.deadline).slice(0, 10) < today;
  },

  lookupSupervisorKpiData(supName) {
    const normSup = this.normalizePersonName(supName);
    if (!normSup) return null;

    const kpiItems = [];

    if (window.KpiModule && typeof window.KpiModule.getBoards === 'function') {
      const boards = window.KpiModule.getBoards() || [];
      boards.forEach(board => {
        if (!Array.isArray(board.rows)) return;
        const matchedStaffRows = board.rows.filter(r => {
          if (r.rowType !== 'STAFF' && r.rowType !== 'SUBTOTAL') return false;
          const nSup = this.normalizePersonName(r.supervisor);
          const nName = this.normalizePersonName(r.name);
          return (nSup && (nSup === normSup || nSup.includes(normSup) || normSup.includes(nSup))) ||
                 (nName && (nName === normSup || nName.includes(normSup) || normSup.includes(nName)));
        });

        const staffOnly = matchedStaffRows.filter(r => r.rowType === 'STAFF');
        const rowsToSum = staffOnly.length > 0 ? staffOnly : matchedStaffRows;

        if (rowsToSum.length > 0) {
          const totalTarget = rowsToSum.reduce((a, b) => a + (Number(b.total) || 0), 0);
          const totalActual = rowsToSum.reduce((a, b) => a + (Number(b.actual) || 0), 0);
          if (totalTarget > 0) {
            kpiItems.push({
              boardTitle: board.title,
              target: totalTarget,
              actual: totalActual,
              rate: Math.round((totalActual / totalTarget) * 100)
            });
          }
        }
      });
    }

    if (kpiItems.length === 0) return null;
    const avgRate = Math.round(kpiItems.reduce((a, b) => a + b.rate, 0) / kpiItems.length);
    return { avgRate, details: kpiItems };
  },

  computeSupervisorEfficiencyAnalytics() {
    if (window.TasksModule) {
      window.TasksModule.fetchTasksFromSupabaseIfNeeded();
    }

    const win = this.getEfficiencyDateWindow();
    const { shops: evaluatedShops, allRegionsShops } = window.DashboardModule
      ? window.DashboardModule.getEvaluatedRealShops()
      : { shops: window.AppStore.shops || [], allRegionsShops: window.AppStore.shops || [] };

    const allTasks = (window.AppStore.tasks || []).filter(t =>
      t.taskType !== 'KPI_BOARDS_STORAGE' &&
      !String(t.id).startsWith('KPI-BOARDS-') &&
      t.status !== 'CANCELLED'
    );

    const shopByDvn = new Map();
    (allRegionsShops || []).forEach(s => {
      if (s.dvn) shopByDvn.set(String(s.dvn).trim().toUpperCase(), s);
    });

    const supNamesSet = new Set();
    (evaluatedShops || []).forEach(s => {
      if (s.supervisor && s.supervisor !== 'Chưa phân công') supNamesSet.add(s.supervisor.trim());
    });
    allTasks.forEach(t => {
      if (t.assignee && t.assignee.trim()) supNamesSet.add(t.assignee.trim());
    });

    const headerRegion = window.AppState?.region || 'ALL';
    const effectiveRegionFilter = this.effRegionFilter !== 'ALL' ? this.effRegionFilter : headerRegion;

    const rows = [];

    Array.from(supNamesSet).sort().forEach(supName => {
      const normSup = this.normalizePersonName(supName);
      const managedShops = (allRegionsShops || []).filter(s =>
        this.normalizePersonName(s.supervisor) === normSup
      );

      const subRegions = [...new Set(managedShops.map(s => s.subRegion).filter(Boolean))];
      const mienCode = managedShops[0]?.region ||
        allTasks.find(t => this.normalizePersonName(t.assignee) === normSup)?.region ||
        'NORTH';

      if (effectiveRegionFilter !== 'ALL' && mienCode !== effectiveRegionFilter) return;
      if (this.effSupervisorFilter !== 'ALL' && supName !== this.effSupervisorFilter) return;

      const regionDisplay = subRegions.length > 0
        ? subRegions.join(', ')
        : (mienCode === 'SOUTH' ? 'Miền Nam 南部' : 'Miền Bắc 北部');

      const weakShopsManaged = managedShops.filter(s => s.eval && s.eval.grade === 'WEAK');
      const weakDvnSet = new Set(weakShopsManaged.map(s => String(s.dvn).trim().toUpperCase()));

      const uniqueTaskMap = new Map();
      allTasks.forEach(t => {
        if (this.normalizePersonName(t.assignee) === normSup) {
          uniqueTaskMap.set(String(t.id), t);
        }
      });
      const supTasks = Array.from(uniqueTaskMap.values());

      const getTaskRefDate = (t) => String(t.deadline || t.startDate || (t.createdAt ? t.createdAt.slice(0, 10) : '')).slice(0, 10);
      const getVisitDate = (t) => String(t.startDate || t.deadline || (t.createdAt ? t.createdAt.slice(0, 10) : '')).slice(0, 10);

      const dueTasksInPeriod = supTasks.filter(t => {
        const d = getTaskRefDate(t);
        return d >= win.start && d <= win.end;
      });

      const completedTasksInPeriod = dueTasksInPeriod.filter(t => t.status === 'COMPLETED');
      const onTimeTasksInPeriod = completedTasksInPeriod.filter(t => {
        if (!t.deadline) return true;
        const compDate = this.getTaskCompletedDate(t);
        return String(compDate).slice(0, 10) <= String(t.deadline).slice(0, 10);
      });

      const onTimeRate = dueTasksInPeriod.length > 0
        ? Math.round((onTimeTasksInPeriod.length / dueTasksInPeriod.length) * 100)
        : null;

      const prevDueTasks = supTasks.filter(t => {
        const d = getTaskRefDate(t);
        return d >= win.prevStart && d <= win.prevEnd;
      });
      const prevCompletedTasks = prevDueTasks.filter(t => t.status === 'COMPLETED');
      const prevOnTimeRate = prevDueTasks.length > 0
        ? Math.round((prevCompletedTasks.length / prevDueTasks.length) * 100)
        : null;

      const visitTasksInPeriod = supTasks.filter(t => {
        const vDate = getVisitDate(t);
        const inPeriod = vDate >= win.start && vDate <= win.end;
        const isVisitRecord =
          t.taskType === 'STORE_VISIT' ||
          String(t.id).startsWith('VISIT-') ||
          (Array.isArray(t.evidenceUrls) && t.evidenceUrls.length > 0);
        return inPeriod && isVisitRecord;
      });

      const visitSessionKeys = new Set();
      const dvnVisitCountMap = new Map();
      const visitedShopsDetailMap = new Map();

      visitTasksInPeriod.forEach(vt => {
        const vDate = getVisitDate(vt);
        const dvns = this.extractDvnCodes(vt.dvn);
        if (dvns.length === 0) {
          visitSessionKeys.add(`${vt.id}_${vDate}`);
        } else {
          dvns.forEach(dvnCode => {
            const sessionKey = `${dvnCode}_${vDate}`;
            if (!visitSessionKeys.has(sessionKey)) {
              visitSessionKeys.add(sessionKey);
              dvnVisitCountMap.set(dvnCode, (dvnVisitCountMap.get(dvnCode) || 0) + 1);
            }
            if (!visitedShopsDetailMap.has(dvnCode)) {
              const sInfo = shopByDvn.get(dvnCode);
              visitedShopsDetailMap.set(dvnCode, {
                dvn: dvnCode,
                name: vt.shopName || sInfo?.name || 'Cửa hàng đại lý',
                province: sInfo?.province || '',
                grade: sInfo?.eval?.label || '—',
                gradeColor: sInfo?.eval?.color || 'bg-slate-100 text-slate-600',
                lastVisitDate: vDate,
                visitCount: 0,
                evidenceCount: 0
              });
            }
            const entry = visitedShopsDetailMap.get(dvnCode);
            entry.visitCount = dvnVisitCountMap.get(dvnCode) || 1;
            entry.evidenceCount += (Array.isArray(vt.evidenceUrls) ? vt.evidenceUrls.length : 0);
            if (vDate > entry.lastVisitDate) entry.lastVisitDate = vDate;
          });
        }
      });

      const prevVisitKeys = new Set();
      supTasks.forEach(vt => {
        const vDate = getVisitDate(vt);
        const isVisitRecord =
          vt.taskType === 'STORE_VISIT' ||
          String(vt.id).startsWith('VISIT-') ||
          (Array.isArray(vt.evidenceUrls) && vt.evidenceUrls.length > 0);
        if (vDate >= win.prevStart && vDate <= win.prevEnd && isVisitRecord) {
          const dvns = this.extractDvnCodes(vt.dvn);
          if (dvns.length === 0) prevVisitKeys.add(`${vt.id}_${vDate}`);
          else dvns.forEach(d => prevVisitKeys.add(`${d}_${vDate}`));
        }
      });

      const issuesInPeriodList = [];
      const resolvedVerifiedList = [];
      const proposedOnlyList = [];
      const backlogIssuesList = [];
      const seenIssueKeys = new Set();

      supTasks.forEach(t => {
        const refDate = getTaskRefDate(t);
        if (refDate > win.end) return;

        const problems = this.extractTaskProblems(t);
        if (problems.length === 0) return;

        const dvnStr = this.extractDvnCodes(t.dvn).join(', ') || 'Toàn vùng';
        const probText = problems.join(' | ');
        const dedupKey = `${dvnStr}::${probText.toLowerCase().slice(0, 80)}`;
        if (seenIssueKeys.has(dedupKey)) return;
        seenIssueKeys.add(dedupKey);

        const hasSolution = Boolean(t.solution && String(t.solution).trim().length > 0);
        const isVerifiedCompleted = t.status === 'COMPLETED';
        const isCarriedFromPrev = refDate < win.start;

        const issueObj = {
          taskId: t.id,
          dvn: dvnStr,
          shopName: t.shopName || (shopByDvn.get(dvnStr)?.name) || '',
          title: t.title,
          problem: probText,
          solution: hasSolution ? String(t.solution).trim() : '',
          deadline: t.deadline || refDate,
          status: t.status,
          isCarriedOver: isCarriedFromPrev,
          isVerified: isVerifiedCompleted,
          isProposedOnly: hasSolution && !isVerifiedCompleted,
          isOverdue: this.isTaskOverdue(t)
        };

        if (refDate >= win.start && refDate <= win.end) {
          issuesInPeriodList.push(issueObj);
          if (isVerifiedCompleted && hasSolution) {
            resolvedVerifiedList.push(issueObj);
          } else if (hasSolution && !isVerifiedCompleted) {
            proposedOnlyList.push(issueObj);
          }
        } else if (isCarriedFromPrev && isVerifiedCompleted) {
          const compDate = this.getTaskCompletedDate(t);
          if (compDate >= win.start && compDate <= win.end && hasSolution) {
            resolvedVerifiedList.push(issueObj);
          }
        }

        if (!isVerifiedCompleted) {
          backlogIssuesList.push(issueObj);
        }
      });

      const supportedWeakDvns = new Set();
      supTasks.forEach(t => {
        const d = getTaskRefDate(t);
        if (d < win.start || d > win.end) return;
        const dvns = this.extractDvnCodes(t.dvn);
        dvns.forEach(code => {
          const upper = code.toUpperCase();
          const shopRef = shopByDvn.get(upper);
          if (weakDvnSet.has(upper) || (shopRef && shopRef.eval && shopRef.eval.grade === 'WEAK')) {
            supportedWeakDvns.add(upper);
          }
        });
      });

      const kpiData = this.lookupSupervisorKpiData(supName);
      const hasKpiData = kpiData !== null;

      let evaluationObj = {
        code: 'NODATA',
        score: null,
        label: window.t('ef_nodata'),
        subText: 'Chưa đủ dữ liệu kỳ này',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-300'
      };

      if (hasKpiData || dueTasksInPeriod.length > 0) {
        const kpiComponent = hasKpiData ? Math.min(100, kpiData.avgRate) : (onTimeRate ?? 0);
        const onTimeComponent = onTimeRate !== null ? onTimeRate : kpiComponent;
        const totalTrackableIssues = issuesInPeriodList.length + backlogIssuesList.filter(x => x.isCarriedOver).length;
        const issueResolutionComponent = totalTrackableIssues > 0
          ? Math.round((resolvedVerifiedList.length / totalTrackableIssues) * 100)
          : onTimeComponent;

        const compositeScore = Math.round(
          kpiComponent * 0.45 +
          onTimeComponent * 0.35 +
          issueResolutionComponent * 0.20
        );

        if (compositeScore >= 85) {
          evaluationObj = {
            code: 'GOOD',
            score: compositeScore,
            label: `${window.t('grade_good')} (${compositeScore}%)`,
            subText: hasKpiData ? `KPI: ${kpiData.avgRate}%` : `Đúng hạn: ${onTimeComponent}%`,
            badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300'
          };
        } else if (compositeScore >= 70) {
          evaluationObj = {
            code: 'AVG',
            score: compositeScore,
            label: `${window.t('grade_avg')} (${compositeScore}%)`,
            subText: hasKpiData ? `KPI: ${kpiData.avgRate}%` : `Đúng hạn: ${onTimeComponent}%`,
            badgeClass: 'bg-amber-50 text-amber-700 border-amber-300'
          };
        } else {
          evaluationObj = {
            code: 'WEAK',
            score: compositeScore,
            label: `Cần cải thiện (${compositeScore}%)`,
            subText: hasKpiData ? `KPI: ${kpiData.avgRate}%` : `Đúng hạn: ${onTimeComponent}%`,
            badgeClass: 'bg-rose-50 text-rose-700 border-rose-300'
          };
        }
      }

      rows.push({
        supervisor: supName,
        mien: mienCode,
        regionDisplay,
        managedShopCount: managedShops.length,
        weakShopTotal: weakShopsManaged.length,
        weakShopSupported: supportedWeakDvns.size,
        dueCount: dueTasksInPeriod.length,
        completedCount: completedTasksInPeriod.length,
        onTimeCount: onTimeTasksInPeriod.length,
        onTimeRate,
        prevDueCount: prevDueTasks.length,
        prevOnTimeRate,
        visitCount: visitSessionKeys.size,
        prevVisitCount: prevVisitKeys.size,
        uniqueDvnCount: dvnVisitCountMap.size,
        visitedShops: Array.from(visitedShopsDetailMap.values()).sort((a, b) => b.visitCount - a.visitCount),
        issuesFoundCount: issuesInPeriodList.length,
        issuesResolvedCount: resolvedVerifiedList.length,
        issuesProposedOnlyCount: proposedOnlyList.length,
        issuesBacklogCount: backlogIssuesList.length,
        carriedOverBacklogCount: backlogIssuesList.filter(i => i.isCarriedOver).length,
        issuesInPeriodList,
        resolvedVerifiedList,
        backlogIssuesList,
        dueTasksInPeriod,
        kpiData,
        evaluation: evaluationObj
      });
    });

    return {
      windowInfo: win,
      rows,
      allSupervisorNames: Array.from(supNamesSet).sort()
    };
  },

  renderSupervisorDetailDrawer(supData, win) {
    if (!supData) return '';

    const tasksByType = {
      TASK: supData.dueTasksInPeriod.filter(t => t.taskType === 'TASK' || (!t.taskType && !String(t.id).startsWith('PLAN-') && !String(t.id).startsWith('VISIT-'))),
      MARKET_PLAN: supData.dueTasksInPeriod.filter(t => t.taskType === 'MARKET_PLAN' || String(t.id).startsWith('PLAN-')),
      STORE_VISIT: supData.dueTasksInPeriod.filter(t => t.taskType === 'STORE_VISIT' || String(t.id).startsWith('VISIT-'))
    };

    const hasTrendData = supData.prevDueCount > 0 || supData.prevVisitCount > 0;
    const visitDiff = supData.visitCount - supData.prevVisitCount;
    const onTimeDiff = (supData.onTimeRate !== null && supData.prevOnTimeRate !== null)
      ? (supData.onTimeRate - supData.prevOnTimeRate)
      : null;

    return `
      <div class="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity">
        <div class="w-full max-w-4xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          <div class="p-5 bg-gradient-to-r from-[#111625] to-slate-800 text-white flex items-center justify-between shrink-0">
            <div>
              <div class="flex items-center gap-2.5">
                <span class="px-2.5 py-1 rounded-lg bg-[#F26522] text-white text-xs font-black uppercase">SUPERVISOR 360°</span>
                <h3 class="text-lg font-black tracking-tight">${supData.supervisor}</h3>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${supData.evaluation.badgeClass}">
                  ${supData.evaluation.label}
                </span>
              </div>
              <p class="text-xs text-slate-300 mt-1">
                Khu vực: <strong>${supData.regionDisplay}</strong> (${supData.managedShopCount} Shop quản lý) • Kỳ phân tích: <strong>${win.label}</strong>
              </p>
            </div>
            <button
              onclick="EfficiencyModule.closeSupervisorEfficiencyDrawer()"
              class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <i class="fa-solid fa-xmark text-base"></i>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-5 space-y-5 text-xs bg-slate-50/60 dark:bg-slate-950">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="card-3d p-3.5 bg-white">
                <div class="text-[10px] font-extrabold uppercase text-slate-400">Hoàn thành Đúng hạn</div>
                <div class="text-lg font-black font-mono text-slate-900 mt-1">
                  ${supData.onTimeRate !== null ? `${supData.onTimeRate}%` : window.t('ef_nodata')}
                </div>
                <div class="text-[11px] text-slate-500">
                  ${supData.completedCount}/${supData.dueCount} việc (${supData.onTimeCount} đúng hạn)
                </div>
              </div>

              <div class="card-3d p-3.5 bg-white">
                <div class="text-[10px] font-extrabold uppercase text-slate-400">Độ phủ Thăm Shop</div>
                <div class="text-lg font-black font-mono text-blue-600 mt-1">
                  ${supData.visitCount} lượt / ${supData.uniqueDvnCount} DVN
                </div>
                <div class="text-[11px] text-slate-500">
                  Hỗ trợ Shop yếu: <strong>${supData.weakShopSupported}/${supData.weakShopTotal}</strong>
                </div>
              </div>

              <div class="card-3d p-3.5 bg-white">
                <div class="text-[10px] font-extrabold uppercase text-slate-400">Xử lý Vấn đề</div>
                <div class="text-lg font-black font-mono text-emerald-600 mt-1">
                  ${supData.issuesResolvedCount} đã xác minh
                </div>
                <div class="text-[11px] text-amber-600 font-semibold">
                  ${supData.issuesProposedOnlyCount} mới đề xuất giải pháp
                </div>
              </div>

              <div class="card-3d p-3.5 bg-white">
                <div class="text-[10px] font-extrabold uppercase text-slate-400">Xu hướng vs Kỳ trước</div>
                ${hasTrendData ? `
                  <div class="text-sm font-black font-mono mt-1 ${visitDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
                    Lượt thăm: ${visitDiff >= 0 ? '+' + visitDiff : visitDiff}
                  </div>
                  <div class="text-[11px] font-mono ${onTimeDiff !== null && onTimeDiff >= 0 ? 'text-emerald-600' : 'text-slate-500'}">
                    Đúng hạn: ${onTimeDiff !== null ? (onTimeDiff >= 0 ? '+' + onTimeDiff + '%' : onTimeDiff + '%') : 'Chưa đủ DL kỳ trước'}
                  </div>
                ` : `
                  <div class="text-xs font-bold text-slate-400 mt-1.5">${window.t('ef_nodata')}</div>
                  <div class="text-[10px] text-slate-400">Kỳ trước (${win.prevStart} → ${win.prevEnd})</div>
                `}
              </div>
            </div>

            <!-- 1. Tổng hợp công việc theo nhóm -->
            <div class="card-3d p-4 bg-white space-y-3">
              <h4 class="font-extrabold text-xs uppercase text-slate-800 flex items-center gap-2">
                <i class="fa-solid fa-layer-group text-[#F26522]"></i>
                1. Tổng Hợp Nội Dung Công Việc Theo Nhóm (${supData.dueTasksInPeriod.length} đầu việc trong kỳ)
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                ${[
                  { title: 'Nhiệm vụ được giao / Cá nhân', list: tasksByType.TASK, badge: 'bg-blue-50 text-blue-700' },
                  { title: 'Kế hoạch tuần thị trường', list: tasksByType.MARKET_PLAN, badge: 'bg-orange-50 text-[#F26522]' },
                  { title: 'Biên bản Check-in cửa hàng', list: tasksByType.STORE_VISIT, badge: 'bg-emerald-50 text-emerald-700' }
                ].map(grp => `
                  <div class="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="font-extrabold text-[11px] text-slate-700">${grp.title}</span>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${grp.badge}">${grp.list.length}</span>
                    </div>
                    <div class="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      ${grp.list.map(t => `
                        <div onclick="window.TasksModule && TasksModule.openTaskDetailModal('${t.id}')" class="p-2 rounded-lg bg-white border border-slate-100 hover:border-[#F26522] cursor-pointer transition">
                          <div class="font-bold text-slate-800 truncate">${t.title}</div>
                          <div class="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
                            <span class="font-mono text-blue-600 font-bold">${t.dvn || t.id}</span>
                            <span>${t.status === 'COMPLETED' ? '✅ Hoàn thành' : t.status === 'PENDING_APPROVAL' ? '⏳ Chờ xác minh' : '🔄 Đang xử lý'}</span>
                          </div>
                        </div>
                      `).join('')}
                      ${grp.list.length === 0 ? `<div class="text-[11px] text-slate-400 italic py-2">Không có bản ghi trong kỳ</div>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- 2. Danh sách cửa hàng đã đến -->
            <div class="card-3d p-4 bg-white space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="font-extrabold text-xs uppercase text-slate-800 flex items-center gap-2">
                  <i class="fa-solid fa-store text-blue-600"></i>
                  2. Danh Sách Cửa Hàng Đã Đến & Tần Suất Thăm Từng Mã DVN (${supData.uniqueDvnCount} mã DVN khác nhau)
                </h4>
                <span class="text-[11px] font-bold text-slate-500">Tổng: ${supData.visitCount} lượt thăm</span>
              </div>

              ${supData.visitedShops.length > 0 ? `
                <div class="overflow-x-auto max-h-48 rounded-xl border border-slate-200">
                  <table class="w-full text-left border-collapse text-xs">
                    <thead class="bg-slate-100 text-slate-600 uppercase font-extrabold">
                      <tr>
                        <th class="py-2 px-3">Mã DVN (Chuỗi)</th>
                        <th class="py-2 px-3">Tên Cửa Hàng</th>
                        <th class="py-2 px-3">Tỉnh / Thành</th>
                        <th class="py-2 px-3 text-center">Xếp Loại S.O</th>
                        <th class="py-2 px-3 text-center">Số Lần Thăm</th>
                        <th class="py-2 px-3 text-center">Ảnh Minh Chứng</th>
                        <th class="py-2 px-3 text-right">Lần Ghé Gần Nhất</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      ${supData.visitedShops.map(vs => `
                        <tr class="hover:bg-slate-50">
                          <td class="py-2 px-3 font-mono font-black text-blue-600">${vs.dvn}</td>
                          <td class="py-2 px-3 font-bold text-slate-900">${vs.name}</td>
                          <td class="py-2 px-3 text-slate-600">${vs.province || '—'}</td>
                          <td class="py-2 px-3 text-center">
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${vs.gradeColor}">${vs.grade}</span>
                          </td>
                          <td class="py-2 px-3 text-center font-mono font-black text-[#F26522]">${vs.visitCount} lần</td>
                          <td class="py-2 px-3 text-center font-mono">${vs.evidenceCount} ảnh</td>
                          <td class="py-2 px-3 text-right font-mono text-slate-500">${vs.lastVisitDate}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : `
                <div class="py-6 text-center text-slate-400 font-semibold bg-slate-50 rounded-xl border border-dashed">
                  Chưa ghi nhận lượt Check-in cửa hàng nào trong kỳ đang chọn.
                </div>
              `}
            </div>

            <!-- 3. Vấn đề phát hiện, Giải pháp, Xác minh & Tồn đọng -->
            <div class="card-3d p-4 bg-white space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h4 class="font-extrabold text-xs uppercase text-slate-800 flex items-center gap-2">
                  <i class="fa-solid fa-screwdriver-wrench text-emerald-600"></i>
                  3. Theo Dõi Vấn Đề Tại Cửa Hàng, Giải Pháp Thực Thi & Tồn Đọng Chuyển Tiếp
                </h4>
                <div class="flex items-center gap-2 text-[11px] font-bold">
                  <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ Đã xác minh: ${supData.issuesResolvedCount}
                  </span>
                  <span class="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    ⏳ Đề xuất chờ duyệt: ${supData.issuesProposedOnlyCount}
                  </span>
                  <span class="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                    ⚠️ Tồn đọng: ${supData.issuesBacklogCount} (Kỳ trước: ${supData.carriedOverBacklogCount})
                  </span>
                </div>
              </div>

              ${(supData.issuesInPeriodList.length > 0 || supData.backlogIssuesList.length > 0) ? `
                <div class="overflow-x-auto max-h-60 rounded-xl border border-slate-200">
                  <table class="w-full text-left border-collapse text-xs">
                    <thead class="bg-slate-100 text-slate-600 uppercase font-extrabold">
                      <tr>
                        <th class="py-2 px-3">Mã DVN / Cửa Hàng</th>
                        <th class="py-2 px-3">Vấn Đề Phát Hiện</th>
                        <th class="py-2 px-3">Giải Pháp Đã Thực Hiện</th>
                        <th class="py-2 px-3 text-center">Trạng Thái Xác Minh</th>
                        <th class="py-2 px-3 text-right">Hạn Xử Lý</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      ${[...supData.backlogIssuesList, ...supData.resolvedVerifiedList].map(iss => `
                        <tr onclick="window.TasksModule && TasksModule.openTaskDetailModal('${iss.taskId}')" class="hover:bg-orange-50/40 cursor-pointer transition">
                          <td class="py-2.5 px-3">
                            <div class="font-mono font-black text-blue-600">${iss.dvn}</div>
                            <div class="text-[10px] text-slate-500 truncate max-w-[140px]">${iss.shopName || iss.title}</div>
                            ${iss.isCarriedOver ? `<span class="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[9px] font-extrabold">${window.t('ef_carried_over')}</span>` : ''}
                          </td>
                          <td class="py-2.5 px-3 max-w-xs">
                            <div class="font-semibold text-slate-800 whitespace-pre-line">${iss.problem}</div>
                          </td>
                          <td class="py-2.5 px-3 max-w-xs">
                            ${iss.solution
                              ? `<div class="text-emerald-800 font-medium whitespace-pre-line">${iss.solution}</div>`
                              : `<span class="text-rose-500 italic font-semibold">Chưa cập nhật giải pháp</span>`
                            }
                          </td>
                          <td class="py-2.5 px-3 text-center">
                            ${iss.isVerified ? `
                              <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                                ✓ ${window.t('ef_verified')}
                              </span>
                            ` : iss.isProposedOnly ? `
                              <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-300">
                                ${window.t('ef_proposed_only')}
                              </span>
                            ` : `
                              <span class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold border border-rose-300">
                                Chưa xử lý
                              </span>
                            `}
                          </td>
                          <td class="py-2.5 px-3 text-right font-mono ${iss.isOverdue ? 'text-rose-600 font-black' : 'text-slate-600'}">
                            ${iss.deadline || '—'}
                            ${iss.isOverdue ? `<div class="text-[9px] text-rose-600 uppercase">Quá hạn</div>` : ''}
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : `
                <div class="py-6 text-center text-slate-400 font-semibold bg-slate-50 rounded-xl border border-dashed">
                  Không có vấn đề phát sinh hoặc tồn đọng nào của Giám sát này.
                </div>
              `}
            </div>

            <!-- 4. KPI liên quan -->
            <div class="card-3d p-4 bg-white space-y-2.5">
              <h4 class="font-extrabold text-xs uppercase text-slate-800 flex items-center gap-2">
                <i class="fa-solid fa-bullseye text-indigo-600"></i>
                4. Kết Quả Các Hạng Mục KPI Liên Quan
              </h4>
              ${supData.kpiData && supData.kpiData.details.length > 0 ? `
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  ${supData.kpiData.details.map(k => `
                    <div class="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                      <div>
                        <div class="font-extrabold text-slate-800">${k.boardTitle}</div>
                        <div class="text-[11px] text-slate-500 mt-0.5">Thực đạt: <strong>${k.actual}</strong> / Chỉ tiêu: <strong>${k.target}</strong></div>
                      </div>
                      <span class="text-base font-black font-mono ${k.rate >= 85 ? 'text-emerald-600' : k.rate >= 60 ? 'text-amber-600' : 'text-rose-600'}">
                        ${k.rate}%
                      </span>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div class="p-3 rounded-xl bg-slate-50 border text-slate-400 font-semibold">
                  ${window.t('ef_nodata')} — Chưa có dòng KPI định danh riêng cho Giám sát này trong bảng KPI hiện tại.
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  render() {
    const { windowInfo, rows, allSupervisorNames } = this.computeSupervisorEfficiencyAnalytics();

    const totalDue = rows.reduce((a, b) => a + b.dueCount, 0);
    const totalCompleted = rows.reduce((a, b) => a + b.completedCount, 0);
    const totalOnTime = rows.reduce((a, b) => a + b.onTimeCount, 0);
    const overallOnTimeRate = totalDue > 0 ? Math.round((totalOnTime / totalDue) * 100) : null;

    const totalVisits = rows.reduce((a, b) => a + b.visitCount, 0);
    const totalUniqueDvn = rows.reduce((a, b) => a + b.uniqueDvnCount, 0);

    const totalIssuesFound = rows.reduce((a, b) => a + b.issuesFoundCount, 0);
    const totalIssuesResolved = rows.reduce((a, b) => a + b.issuesResolvedCount, 0);
    const totalBacklog = rows.reduce((a, b) => a + b.issuesBacklogCount, 0);

    const totalWeakShops = rows.reduce((a, b) => a + b.weakShopTotal, 0);
    const totalWeakSupported = rows.reduce((a, b) => a + b.weakShopSupported, 0);

    const activeSupData = this.activeDrawerSupervisor
      ? rows.find(r => r.supervisor === this.activeDrawerSupervisor)
      : null;

    return `
      <div class="space-y-5">
        <div class="card-3d p-5 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="font-black text-base sm:text-lg uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <i class="fa-solid fa-chart-line text-[#F26522]"></i>
              ${window.t('ef_title')}
              <span class="px-2.5 py-0.5 rounded-lg bg-orange-50 text-[#F26522] text-xs font-mono">${windowInfo.label}</span>
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">${window.t('ef_subtitle')}</p>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl font-bold">
              ${[
                { id: 'WEEK', label: window.t('ef_mode_week') },
                { id: 'MONTH', label: window.t('ef_mode_month') },
                { id: 'CUSTOM', label: window.t('ef_mode_custom') }
              ].map(m => `
                <button
                  type="button"
                  onclick="EfficiencyModule.setEfficiencyPeriodMode('${m.id}')"
                  class="px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    this.effPeriodMode === m.id ? 'bg-[#111625] text-white shadow' : 'text-slate-600 hover:text-slate-900'
                  }"
                >
                  ${m.label}
                </button>
              `).join('')}
            </div>

            <div class="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <input
                type="date"
                value="${windowInfo.start}"
                onchange="EfficiencyModule.setEfficiencyCustomDate('effStartDate', this.value)"
                class="bg-transparent font-mono font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              />
              <span class="text-slate-400">→</span>
              <input
                type="date"
                value="${windowInfo.end}"
                onchange="EfficiencyModule.setEfficiencyCustomDate('effEndDate', this.value)"
                class="bg-transparent font-mono font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              />
            </div>

            <select
              onchange="EfficiencyModule.setFilter('effRegionFilter', this.value)"
              class="px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL" ${this.effRegionFilter === 'ALL' ? 'selected' : ''}>-- Toàn quốc --</option>
              <option value="NORTH" ${this.effRegionFilter === 'NORTH' ? 'selected' : ''}>Miền Bắc 北部</option>
              <option value="SOUTH" ${this.effRegionFilter === 'SOUTH' ? 'selected' : ''}>Miền Nam 南部</option>
            </select>

            <select
              onchange="EfficiencyModule.setFilter('effSupervisorFilter', this.value)"
              class="px-3 py-2 rounded-xl border border-slate-200 font-bold text-orange-600 focus:outline-none cursor-pointer"
            >
              <option value="ALL">-- Tất cả Giám sát (${allSupervisorNames.length}) --</option>
              ${allSupervisorNames.map(s => `<option value="${s}" ${this.effSupervisorFilter === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- 6 KPI CARDS TỔNG HỢP -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div class="card-3d tilt-card p-4 border-t-4 border-t-slate-800">
            <div class="text-[11px] font-extrabold uppercase text-slate-500">${window.t('ef_card_due')}</div>
            <div class="my-1.5 text-2xl font-black font-mono text-slate-900 dark:text-white">${totalDue}</div>
            <div class="text-[11px] text-slate-500">Hoàn thành: <strong class="text-emerald-600">${totalCompleted}</strong></div>
          </div>

          <div class="card-3d tilt-card p-4 border-t-4 border-t-emerald-500">
            <div class="text-[11px] font-extrabold uppercase text-slate-500">${window.t('ef_card_ontime')}</div>
            <div class="my-1.5 text-2xl font-black font-mono text-emerald-600">
              ${overallOnTimeRate !== null ? `${overallOnTimeRate}%` : '—'}
            </div>
            <div class="text-[11px] text-slate-500">
              ${overallOnTimeRate !== null ? `${totalOnTime}/${totalDue} việc đúng hạn` : window.t('ef_nodata')}
            </div>
          </div>

          <div class="card-3d tilt-card p-4 border-t-4 border-t-blue-500">
            <div class="text-[11px] font-extrabold uppercase text-slate-500">${window.t('ef_card_visits')}</div>
            <div class="my-1.5 text-2xl font-black font-mono text-blue-600">${totalVisits} <span class="text-sm text-slate-400">/ ${totalUniqueDvn} DVN</span></div>
            <div class="text-[11px] text-slate-500">Khử trùng lặp theo ngày</div>
          </div>

          <div class="card-3d tilt-card p-4 border-t-4 border-t-indigo-500">
            <div class="text-[11px] font-extrabold uppercase text-slate-500">${window.t('ef_card_issues')}</div>
            <div class="my-1.5 text-2xl font-black font-mono text-indigo-600">${totalIssuesFound} <span class="text-sm text-emerald-600">/ ${totalIssuesResolved}</span></div>
            <div class="text-[11px] text-slate-500">Đã xác minh kết quả</div>
          </div>

          <div class="card-3d tilt-card p-4 border-t-4 border-t-rose-500">
            <div class="text-[11px] font-extrabold uppercase text-rose-600">${window.t('ef_card_backlog')}</div>
            <div class="my-1.5 text-2xl font-black font-mono text-rose-600">${totalBacklog}</div>
            <div class="text-[11px] text-slate-500">Gồm cả tồn đọng kỳ trước</div>
          </div>

          <div class="card-3d tilt-card p-4 border-t-4 border-t-[#F26522]">
            <div class="text-[11px] font-extrabold uppercase text-slate-500">${window.t('ef_card_weak_supported')}</div>
            <div class="my-1.5 text-2xl font-black font-mono text-[#F26522]">${totalWeakSupported} <span class="text-sm text-slate-400">/ ${totalWeakShops}</span></div>
            <div class="text-[11px] text-slate-500">Shop S.O &lt; 15 xe được hỗ trợ</div>
          </div>
        </div>

        <!-- BẢNG 12 CỘT SO SÁNH HIỆU QUẢ TỪNG GIÁM SÁT -->
        <div class="card-3d overflow-hidden bg-white dark:bg-slate-900">
          <div class="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <h4 class="font-extrabold text-sm uppercase text-slate-900 dark:text-white">
                Bảng Tổng Hợp & So Sánh Hiệu Quả Giám Sát (${rows.length} Giám sát)
              </h4>
              <span class="text-[11px] font-bold text-[#F26522] animate-pulse">
                • Nhấn vào tên Giám sát để mở Drawer phân tích chi tiết 360° ↗
              </span>
            </div>
            <span class="text-[11px] text-slate-500 font-medium">
              Quy tắc: Không đánh giá Tốt/Yếu chỉ qua số lượt thăm; tự động hiển thị "Chưa đủ dữ liệu" khi thiếu thông tin.
            </span>
          </div>

          <div class="overflow-x-auto max-h-[65vh]">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase font-extrabold border-b">
                <tr>
                  <th class="py-3.5 px-3">${window.t('ef_col_sup')}</th>
                  <th class="py-3.5 px-3">${window.t('ef_col_region')}</th>
                  <th class="py-3.5 px-3 text-center">${window.t('ef_col_due')}</th>
                  <th class="py-3.5 px-3 text-center">${window.t('ef_col_completed')}</th>
                  <th class="py-3.5 px-3 text-center">${window.t('ef_col_ontime')}</th>
                  <th class="py-3.5 px-3 text-center">${window.t('ef_col_visits')}</th>
                  <th class="py-3.5 px-3 text-center">${window.t('ef_col_unique_dvn')}</th>
                  <th class="py-3.5 px-3 text-center">${window.t('ef_col_issues_found')}</th>
                  <th class="py-3.5 px-3 text-center">${window.t('ef_col_issues_resolved')}</th>
                  <th class="py-3.5 px-3 text-center">${window.t('ef_col_issues_backlog')}</th>
                  <th class="py-3.5 px-3 text-center">${window.t('ef_col_weak_shops')}</th>
                  <th class="py-3.5 px-3 text-center">${window.t('ef_col_kpi_eval')}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                ${rows.map(r => {
                  const safeSup = String(r.supervisor).replace(/'/g, "\\'");
                  return `
                    <tr class="hover:bg-orange-50/40 transition">
                      <td class="py-3 px-3">
                        <button
                          type="button"
                          onclick="EfficiencyModule.openSupervisorEfficiencyDrawer('${safeSup}')"
                          class="font-extrabold text-orange-600 hover:text-[#F26522] hover:underline flex items-center gap-1.5 cursor-pointer text-left"
                        >
                          <i class="fa-solid fa-chart-pie text-[11px]"></i>
                          <span>${r.supervisor}</span>
                        </button>
                      </td>

                      <td class="py-3 px-3">
                        <div class="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[160px]" title="${r.regionDisplay}">${r.regionDisplay}</div>
                        <div class="text-[10px] text-slate-400">${r.managedShopCount} cửa hàng</div>
                      </td>

                      <td class="py-3 px-3 text-center font-mono font-bold text-slate-800">
                        ${r.dueCount > 0 ? r.dueCount : `<span class="text-slate-400 text-[11px]">${window.t('ef_nodata')}</span>`}
                      </td>

                      <td class="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                        ${r.dueCount > 0 ? r.completedCount : `<span class="text-slate-400 text-[11px]">—</span>`}
                      </td>

                      <td class="py-3 px-3 text-center font-mono">
                        ${r.onTimeRate !== null ? `
                          <span class="px-2 py-0.5 rounded-md font-extrabold ${
                            r.onTimeRate >= 85 ? 'bg-emerald-50 text-emerald-700' : r.onTimeRate >= 65 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                          }">
                            ${r.onTimeRate}%
                          </span>
                        ` : `<span class="text-slate-400 text-[11px]">${window.t('ef_nodata')}</span>`}
                      </td>

                      <td class="py-3 px-3 text-center font-mono font-bold text-blue-600">${r.visitCount}</td>
                      <td class="py-3 px-3 text-center font-mono font-black text-indigo-600">${r.uniqueDvnCount} <span class="text-[10px] font-normal text-slate-400">DVN</span></td>
                      <td class="py-3 px-3 text-center font-mono font-bold text-slate-800">${r.issuesFoundCount}</td>

                      <td class="py-3 px-3 text-center font-mono">
                        <span class="font-extrabold text-emerald-600">${r.issuesResolvedCount}</span>
                        ${r.issuesProposedOnlyCount > 0 ? `
                          <span class="text-[10px] text-amber-600 font-bold block">(+${r.issuesProposedOnlyCount} đề xuất)</span>
                        ` : ''}
                      </td>

                      <td class="py-3 px-3 text-center font-mono">
                        <span class="font-extrabold ${r.issuesBacklogCount > 0 ? 'text-rose-600' : 'text-slate-400'}">${r.issuesBacklogCount}</span>
                        ${r.carriedOverBacklogCount > 0 ? `
                          <span class="text-[10px] text-purple-600 font-bold block">(${r.carriedOverBacklogCount} kỳ trước)</span>
                        ` : ''}
                      </td>

                      <td class="py-3 px-3 text-center font-mono">
                        ${r.weakShopTotal > 0 ? `
                          <span class="font-extrabold ${r.weakShopSupported > 0 ? 'text-[#F26522]' : 'text-slate-500'}">
                            ${r.weakShopSupported} / ${r.weakShopTotal}
                          </span>
                        ` : `<span class="text-slate-400 text-[11px]">0 shop yếu</span>`}
                      </td>

                      <td class="py-3 px-3 text-center">
                        <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${r.evaluation.badgeClass}">
                          ${r.evaluation.label}
                        </span>
                        <div class="text-[10px] text-slate-400 font-mono mt-0.5">${r.evaluation.subText}</div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        ${activeSupData ? this.renderSupervisorDetailDrawer(activeSupData, windowInfo) : ''}
      </div>
    `;
  }
};