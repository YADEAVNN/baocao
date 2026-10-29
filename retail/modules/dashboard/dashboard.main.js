// modules/dashboard/dashboard.main.js
window.DashboardModule = {
  topShopTab: 'GROWTH', // 'GROWTH' | 'DECLINE'
  gradeModalState: {
    grade: 'ALL',
    subRegion: 'ALL',
    director: 'ALL',
    supervisor: 'ALL',
    sale: 'ALL',
    search: ''
  },

  create3DPrism(cx, baseY, width, height, depthX, depthY, valueText) {
    const x = cx - width / 2;
    const y = baseY - height;

    const frontRect = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="url(#orangeFront)" rx="1.5" />`;
    const topPoints = `${x},${y} ${x + depthX},${y - depthY} ${x + width + depthX},${y - depthY} ${x + width},${y}`;
    const topFace = `<polygon points="${topPoints}" fill="url(#orangeTop)" />`;
    const sidePoints = `${x + width},${y} ${x + width + depthX},${y - depthY} ${x + width + depthX},${baseY - depthY} ${x + width},${baseY}`;
    const sideFace = `<polygon points="${sidePoints}" fill="url(#orangeSide)" />`;
    const shadowPoints = `${x + 3},${baseY + 2} ${x + width + depthX + 9},${baseY - depthY + 4} ${x + width + depthX + 2},${baseY + 5}`;
    const floorShadow = `<polygon points="${shadowPoints}" fill="rgba(15, 23, 42, 0.18)" />`;
    const edgeHighlight = `<line x1="${x + width}" y1="${y}" x2="${x + width}" y2="${baseY}" stroke="rgba(255,255,255,0.5)" stroke-width="1" />`;

    const labelY = y - depthY - 9;
    const labelCenterX = cx + depthX / 2;
    const valueBadge = `
      <g transform="translate(${labelCenterX}, ${labelY})">
        <rect x="-24" y="-10" width="48" height="15" rx="4" fill="#c2410c" opacity="0.95" />
        <text x="0" y="1" text-anchor="middle" class="text-[9px] font-mono font-extrabold fill-white">${valueText}</text>
      </g>
    `;

    return floorShadow + frontRect + topFace + sideFace + edgeHighlight + valueBadge;
  },

  resolveMienCode(mienStr) {
    if (window.AppUtils && window.AppUtils.resolveMienCode) {
      return window.AppUtils.resolveMienCode(mienStr);
    }
    const text = String(mienStr || '').toUpperCase();
    if (text.includes('NAM') || text.includes('南部') || text === 'SOUTH') return 'SOUTH';
    return 'NORTH';
  },

  getSelectedPeriod() {
    const raw = window.AppState?.month || '2026-09';
    const parts = raw.split('-');
    const year = parseInt(parts[0], 10) || 2026;
    const month = parseInt(parts[1], 10) || 9;

    setTimeout(() => {
      const mEl = document.getElementById('filter-month-num');
      const yEl = document.getElementById('filter-year-num');
      if (mEl) mEl.value = month < 10 ? `0${month}` : `${month}`;
      if (yEl) yEl.value = `${year}`;

      const regSelect = document.getElementById('filter-region');
      if (regSelect) {
        const centralOpt = regSelect.querySelector('option[value="CENTRAL"]');
        if (centralOpt) centralOpt.remove();
      }
    }, 0);

    return { year, month };
  },

  getRawSO(rawShop, year, month) {
    if (!rawShop) return null;
    const yKey = `so${year}`;
    const mKey = `T${Number(month)}`;
    if (rawShop[yKey] && rawShop[yKey][mKey] !== undefined && rawShop[yKey][mKey] !== null) {
      return Number(rawShop[yKey][mKey]);
    }
    if (year > 2026 && rawShop.so2026 && rawShop.so2026[`Y${year}_${mKey}`] !== undefined && rawShop.so2026[`Y${year}_${mKey}`] !== null) {
      return Number(rawShop.so2026[`Y${year}_${mKey}`]);
    }
    return null;
  },

  getEvaluatedRealShops() {
    const { year, month } = this.getSelectedPeriod();
    const regionFilter = window.AppState?.region || 'ALL';
    const rawList = window.AdminShopsModule ? window.AdminShopsModule.getList() : [];

    let hasDataInSelectedMonth = rawList.some(item => this.getRawSO(item, year, month) !== null);
    let effectiveYear = year;
    let effectiveMonth = month;

    if (!hasDataInSelectedMonth && !this._userChangedPeriod) {
      for (let m = 12; m >= 1; m--) {
        if (rawList.some(item => this.getRawSO(item, year, m) !== null)) {
          effectiveMonth = m;
          window.AppState.month = `${year}-${m < 10 ? '0' + m : m}`;
          break;
        }
      }
    }

    const effPrevM = effectiveMonth > 1 ? effectiveMonth - 1 : 12;
    const effPrevY = effectiveMonth > 1 ? effectiveYear : effectiveYear - 1;

    const mapped = rawList.map(item => {
      const enumRegion = this.resolveMienCode(item.mien);

      const curSO = this.getRawSO(item, effectiveYear, effectiveMonth);
      const prevSO = this.getRawSO(item, effPrevY, effPrevM);
      const lastYearSO = this.getRawSO(item, effectiveYear - 1, effectiveMonth);

      const mom = (curSO !== null && prevSO !== null && prevSO > 0)
        ? Math.round(((curSO - prevSO) / prevSO) * 100)
        : null;

      const yoy = (curSO !== null && lastYearSO !== null && lastYearSO > 0)
        ? Math.round(((curSO - lastYearSO) / lastYearSO) * 100)
        : null;

      const shopObj = {
        dvn: String(item.dvn || '').trim(),
        svn: String(item.svn || '').trim(),
        name: item.name || '',
        mienLabel: enumRegion === 'SOUTH' ? 'Miền Nam 南部' : 'Miền Bắc 北部',
        region: enumRegion,
        subRegion: item.region || '',
        province: item.province || '',
        ward: item.ward || '',
        shopType: item.shopType || 'A形象店',
        supervisor: item.supervisor || item.gdMien || 'Chưa phân công',
        director: item.gdKhuVuc || 'Chưa phân công',
        sale: item.sale || 'Chưa phân công',
        currentSO: curSO,
        prevSO: prevSO,
        lastYearSO: lastYearSO,
        mom: mom,
        yoy: yoy,
        hasFullData: curSO !== null
      };

      return {
        ...shopObj,
        eval: window.AppStore.evaluateShop(shopObj),
        rawRef: item
      };
    });

    const filteredByRegion = mapped.filter(s => regionFilter === 'ALL' || s.region === regionFilter);

    return {
      shops: filteredByRegion,
      allRegionsShops: mapped,
      effectiveYear,
      effectiveMonth
    };
  },

  setTopShopTab(tab) {
    this.topShopTab = tab;
    window.App.renderCurrentModule();
  },

  render() {
    this._userChangedPeriod = true;
    const { shops: evaluated, allRegionsShops, effectiveYear, effectiveMonth } = this.getEvaluatedRealShops();

    const totalShops = evaluated.length;
    const totalSO = evaluated.reduce((acc, s) => acc + (s.currentSO || 0), 0);
    const totalPrevSO = evaluated.reduce((acc, s) => acc + (s.prevSO || 0), 0);
    const totalLastYearSO = evaluated.reduce((acc, s) => acc + (s.lastYearSO || 0), 0);

    const realMoMPct = totalPrevSO > 0 ? (((totalSO - totalPrevSO) / totalPrevSO) * 100).toFixed(1) : null;
    const realYoYPct = totalLastYearSO > 0 ? (((totalSO - totalLastYearSO) / totalLastYearSO) * 100).toFixed(1) : null;

    const momDisplay = realMoMPct !== null ? `${realMoMPct >= 0 ? '+' : ''}${realMoMPct}%` : 'Chưa đủ DL';
    const yoyDisplay = realYoYPct !== null ? `${realYoYPct >= 0 ? '+' : ''}${realYoYPct}%` : 'Chưa đủ DL';

    const goodShops = evaluated.filter(s => s.eval.grade === 'GOOD').length;
    const avgShops = evaluated.filter(s => s.eval.grade === 'AVG').length;
    const weakShops = evaluated.filter(s => s.eval.grade === 'WEAK').length;
    const noDataShops = evaluated.filter(s => s.eval.grade === 'NODATA').length;

    const avgSO = totalShops > 0 ? Math.round(totalSO / totalShops) : 0;
    const region = window.AppState.region;
    const overdueTasks = window.AppStore.tasks.filter(t => t.status === 'OVERDUE' && (region === 'ALL' || t.region === region)).length;

    const kpiCards = [
      { label: t('kpi_total_shops'), value: totalShops, sub: "Bấm để xem danh sách", icon: "store", border: "border-t-blue-500", text: "text-blue-600", clickGrade: "ALL" },
      { label: t('kpi_monthly_so'), value: totalSO.toLocaleString(), sub: `TB: ${avgSO} xe/shop (T${effectiveMonth}/${effectiveYear})`, icon: "shopping-bag", border: "border-t-orange-500", text: "text-orange-600", clickGrade: "ALL" },
      { label: t('kpi_mom'), value: momDisplay, sub: `Tháng trước: ${totalPrevSO.toLocaleString()} xe`, icon: "trending-up", border: "border-t-emerald-500", text: Number(realMoMPct) < 0 ? "text-rose-600" : "text-emerald-600" },
      { label: t('kpi_yoy'), value: yoyDisplay, sub: `Cùng kỳ: ${totalLastYearSO.toLocaleString()} xe`, icon: "bar-chart-2", border: "border-t-emerald-500", text: Number(realYoYPct) < 0 ? "text-rose-600" : "text-emerald-600" },
      { label: t('kpi_good_shops'), value: goodShops, sub: "S.O >= 35 xe hoặc Tăng mạnh", icon: "award", border: "border-t-emerald-500", text: "text-emerald-600", clickGrade: "GOOD" },
      { label: t('kpi_avg_shops'), value: avgShops, sub: "S.O từ 15 - 34 xe (Bấm xem)", icon: "minus-circle", border: "border-t-amber-500", text: "text-amber-600", clickGrade: "AVG" },
      { label: t('kpi_weak_shops'), value: weakShops, sub: "S.O < 15 xe (Bấm xem)", icon: "alert-triangle", border: "border-t-rose-500", text: "text-rose-600", clickGrade: "WEAK" },
      { label: t('kpi_support_shops'), value: weakShops, sub: "Cần thúc đẩy Sell-out", icon: "life-buoy", border: "border-t-rose-500", text: "text-rose-600", clickGrade: "WEAK" },
      { label: "S.O Trung Bình / Shop", value: `${avgSO} xe`, sub: `Tỷ lệ có số: ${totalShops - noDataShops}/${totalShops} shop`, icon: "target", border: "border-t-indigo-500", text: "text-indigo-600", clickGrade: "ALL" },
      { label: t('kpi_overdue_tasks'), value: overdueTasks, sub: "Cần xử lý ngay", icon: "clock", border: "border-t-rose-500", text: "text-rose-600" }
    ];

    const series12 = [];
    for (let i = 11; i >= 0; i--) {
      let m = effectiveMonth - i;
      let y = effectiveYear;
      if (m <= 0) {
        m += 12;
        y -= 1;
      }
      let sumM = 0;
      evaluated.forEach(s => {
        const v = this.getRawSO(s.rawRef, y, m);
        if (typeof v === 'number') sumM += v;
      });
      series12.push({
        month: `T${m < 10 ? '0' + m : m}/${String(y).slice(-2)}`,
        value: sumM
      });
    }

    const highestVal = Math.max(...series12.map(x => x.value), 100);
    const maxSO12 = Math.ceil((highestVal * 1.18) / 1000) * 1000;
    const baseY = 255;
    const chartH = 185;
    let barsSvg = '';
    let splinePoints = [];

    series12.forEach((item, idx) => {
      const cx = 92 + idx * 54;
      const ratio = maxSO12 > 0 ? Math.min(1, item.value / maxSO12) : 0;
      const barH = Math.max(8, Math.round(ratio * chartH));
      const topY = baseY - barH;
      splinePoints.push(`${cx},${topY - 18}`);

      barsSvg += `
        <g class="bar-3d-group">
          <title>${item.month}: ${item.value.toLocaleString()} xe</title>
          ${this.create3DPrism(cx, baseY, 26, barH, 10, 8, item.value.toLocaleString())}
          <text x="${cx}" y="280" text-anchor="middle" class="text-[10px] font-bold fill-slate-500">${item.month}</text>
        </g>
      `;
    });

    const northShops = allRegionsShops.filter(s => s.region === 'NORTH');
    const southShops = allRegionsShops.filter(s => s.region === 'SOUTH');

    const northSO = northShops.reduce((a, b) => a + (b.currentSO || 0), 0);
    const southSO = southShops.reduce((a, b) => a + (b.currentSO || 0), 0);
    const nationalSO = Math.max(1, northSO + southSO);

    const northPct = Math.round((northSO / nationalSO) * 100);
    const southPct = Math.max(0, 100 - northPct);

    const supMap = new Map();
    evaluated.forEach(s => {
      const name = s.supervisor || 'Chưa phân công';
      if (!supMap.has(name)) {
        supMap.set(name, { name, totalSO: 0, shopCount: 0 });
      }
      const entry = supMap.get(name);
      entry.totalSO += (s.currentSO || 0);
      entry.shopCount += 1;
    });
    const maxSupSO = Math.max(...Array.from(supMap.values()).map(x => x.totalSO), 1);
    const supRanking = Array.from(supMap.values())
      .map(item => ({
        ...item,
        avgPerShop: item.shopCount > 0 ? Math.round(item.totalSO / item.shopCount) : 0,
        barPct: Math.max(8, Math.round((item.totalSO / maxSupSO) * 100))
      }))
      .sort((a, b) => b.totalSO - a.totalSO);

    const shopsWithYoY = evaluated.filter(s => s.yoy !== null && s.currentSO !== null);
    const displayedTopShops = this.topShopTab === 'GROWTH'
      ? [...shopsWithYoY].sort((a, b) => b.yoy - a.yoy).slice(0, 15)
      : [...shopsWithYoY].sort((a, b) => a.yoy - b.yoy).slice(0, 15);

    return `
      <!-- 10 KPI CARDS -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        ${kpiCards.map(c => `
          <div
            ${c.clickGrade ? `onclick="DashboardModule.openGradeDrilldownModal('${c.clickGrade}')"` : ''}
            class="card-3d tilt-card p-4 border-t-4 ${c.border} flex flex-col justify-between ${c.clickGrade ? 'cursor-pointer hover:ring-2 hover:ring-orange-400/50' : ''}"
          >
            <div class="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>${c.label}</span>
              <i data-lucide="${c.icon}" class="w-4 h-4 ${c.text}"></i>
            </div>
            <div class="my-2 text-2xl font-extrabold font-mono text-slate-900 dark:text-white">${c.value}</div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 font-medium">${c.sub}</div>
          </div>
        `).join('')}
      </div>

      <!-- DÒNG BIỂU ĐỒ 1: XU HƯỚNG S.O 12 THÁNG & TỶ TRỌNG 2 MIỀN BẮC - NAM -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="card-3d p-6 lg:col-span-2 flex flex-col justify-between">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div>
              <h3 class="font-extrabold text-sm sm:text-base uppercase tracking-wide text-slate-800 dark:text-white flex items-center gap-2">
                <i data-lucide="bar-chart-big" class="w-5 h-5 text-[#F26522]"></i>
                ${t('chart_so_12m')} — 3D VOLUMETRIC
              </h3>
              <p class="text-[11px] text-slate-400">Số liệu thực tế 12 tháng tính đến Tháng ${effectiveMonth}/${effectiveYear}</p>
            </div>
            <div class="flex items-center gap-3 text-xs font-bold">
              <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Đường xu hướng</span>
              <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-[#F26522] inline-block"></span> Sản lượng S.O</span>
            </div>
          </div>

          <div class="w-full overflow-x-auto">
            <svg viewBox="0 0 740 295" class="w-full h-auto min-w-[580px] select-none">
              <defs>
                <linearGradient id="orangeFront" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#fb923c" />
                  <stop offset="50%" stop-color="#F26522" />
                  <stop offset="100%" stop-color="#c2410c" />
                </linearGradient>
                <linearGradient id="orangeTop" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#ffedd5" />
                  <stop offset="100%" stop-color="#fdba74" />
                </linearGradient>
                <linearGradient id="orangeSide" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#ea580c" />
                  <stop offset="100%" stop-color="#7c2d12" />
                </linearGradient>
                <linearGradient id="floorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="rgba(148, 163, 184, 0.12)" />
                  <stop offset="100%" stop-color="rgba(148, 163, 184, 0.28)" />
                </linearGradient>
              </defs>

              <g class="text-[10px] font-mono fill-slate-400">
                <g transform="translate(0, 65)"><text x="50" y="4" text-anchor="end">${maxSO12.toLocaleString()}</text><line x1="58" y1="0" x2="715" y2="0" stroke="currentColor" stroke-opacity="0.15" stroke-dasharray="4 4"/></g>
                <g transform="translate(0, 112)"><text x="50" y="4" text-anchor="end">${Math.round(maxSO12 * 0.75).toLocaleString()}</text><line x1="58" y1="0" x2="715" y2="0" stroke="currentColor" stroke-opacity="0.15" stroke-dasharray="4 4"/></g>
                <g transform="translate(0, 160)"><text x="50" y="4" text-anchor="end">${Math.round(maxSO12 * 0.5).toLocaleString()}</text><line x1="58" y1="0" x2="715" y2="0" stroke="currentColor" stroke-opacity="0.15" stroke-dasharray="4 4"/></g>
                <g transform="translate(0, 207)"><text x="50" y="4" text-anchor="end">${Math.round(maxSO12 * 0.25).toLocaleString()}</text><line x1="58" y1="0" x2="715" y2="0" stroke="currentColor" stroke-opacity="0.15" stroke-dasharray="4 4"/></g>
                <g transform="translate(0, 255)"><text x="50" y="4" text-anchor="end">0</text></g>
              </g>

              <polygon points="58,255 72,244 728,244 715,255" fill="url(#floorGrad)" />
              <rect x="58" y="255" width="657" height="5" rx="2" fill="rgba(148, 163, 184, 0.35)" />

              ${barsSvg}

              <polyline points="${splinePoints.join(' ')}" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
        </div>

        <!-- TỶ TRỌNG S.O THEO 2 MIỀN & PHÂN BỐ XẾP LOẠI -->
        <div class="card-3d p-6 flex flex-col justify-between">
          <div>
            <h3 class="font-extrabold text-sm uppercase tracking-wide text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i data-lucide="pie-chart" class="w-4 h-4 text-blue-600"></i>
              TỶ TRỌNG S.O THEO MIỀN (BẮC - NAM)
            </h3>
            <div class="space-y-5 text-xs">
              <div>
                <div class="flex justify-between font-bold mb-1.5">
                  <span>Miền Bắc (北部) • <span class="text-slate-400 font-normal">${northShops.length} shop</span></span>
                  <span class="font-mono text-blue-600 font-extrabold">${northPct}% (${northSO.toLocaleString()} xe)</span>
                </div>
                <div class="h-4 bg-slate-200/70 dark:bg-slate-800 rounded-lg p-0.5">
                  <div class="hbar-3d-bar h-full" style="width:${Math.max(4, northPct)}%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between font-bold mb-1.5">
                  <span>Miền Nam (南部) • <span class="text-slate-400 font-normal">${southShops.length} shop</span></span>
                  <span class="font-mono text-orange-600 font-extrabold">${southPct}% (${southSO.toLocaleString()} xe)</span>
                </div>
                <div class="h-4 bg-slate-200/70 dark:bg-slate-800 rounded-lg p-0.5">
                  <div class="hbar-3d-bar h-full" style="width:${Math.max(4, southPct)}%; background: linear-gradient(90deg, #F26522, #fb923c); box-shadow: 0 4px 0 #c2410c;"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-extrabold text-xs text-slate-500 uppercase">${t('chart_shop_grade')}</h4>
              <span class="text-[10px] font-bold text-[#F26522] animate-pulse">Bấm vào ô để lọc Shop ↗</span>
            </div>
            <div class="grid grid-cols-4 gap-2 text-center text-xs">
              <button onclick="DashboardModule.openGradeDrilldownModal('GOOD')" class="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition cursor-pointer hover:scale-105">
                <div class="font-black font-mono text-emerald-600 text-lg">${goodShops}</div>
                <div class="text-[10px] font-bold">${t('grade_good')}</div>
                <div class="text-[9px] text-slate-400">>= 35 xe</div>
              </button>
              <button onclick="DashboardModule.openGradeDrilldownModal('AVG')" class="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition cursor-pointer hover:scale-105">
                <div class="font-black font-mono text-amber-600 text-lg">${avgShops}</div>
                <div class="text-[10px] font-bold">${t('grade_avg')}</div>
                <div class="text-[9px] text-slate-400">15 - 34 xe</div>
              </button>
              <button onclick="DashboardModule.openGradeDrilldownModal('WEAK')" class="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition cursor-pointer hover:scale-105">
                <div class="font-black font-mono text-rose-600 text-lg">${weakShops}</div>
                <div class="text-[10px] font-bold">${t('grade_weak')}</div>
                <div class="text-[9px] text-slate-400">< 15 xe</div>
              </button>
              <button onclick="DashboardModule.openGradeDrilldownModal('NODATA')" class="p-2.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 border border-slate-400/30 transition cursor-pointer hover:scale-105">
                <div class="font-black font-mono text-slate-600 text-lg">${noDataShops}</div>
                <div class="text-[10px] font-bold">Thiếu DL</div>
                <div class="text-[9px] text-slate-400">NULL</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- DÒNG BIỂU ĐỒ 2: SẢN LƯỢNG TỪNG GIÁM SÁT & TOP 15 SHOP BIẾN ĐỘNG -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card-3d p-6 flex flex-col justify-between">
          <div>
            <h3 class="font-extrabold text-sm uppercase tracking-wide text-slate-800 dark:text-white mb-4 flex items-center justify-between">
              <span class="flex items-center gap-2">
                <i data-lucide="users" class="w-4 h-4 text-indigo-600"></i>
                SẢN LƯỢNG S.O THEO GIÁM SÁT
              </span>
              <span class="text-[11px] font-semibold text-slate-400">Bấm tên Giám sát để xem Shop</span>
            </h3>
            <div class="space-y-4 text-xs max-h-[300px] overflow-y-auto pr-1.5">
              ${supRanking.map((sup, i) => `
                <div onclick="DashboardModule.openGradeDrilldownModal('ALL'); DashboardModule.updateGradeModalFilter('supervisor', '${sup.name}')" class="cursor-pointer group">
                  <div class="flex justify-between font-bold mb-1">
                    <span class="flex items-center gap-1.5 group-hover:text-[#F26522] transition">
                      <span class="w-4 h-4 rounded-full bg-amber-400 text-slate-900 text-[10px] flex items-center justify-center font-extrabold">${i + 1}</span>
                      ${sup.name} <span class="text-[10px] text-slate-400 font-normal">(${sup.shopCount} shop)</span>
                    </span>
                    <span class="font-mono font-extrabold text-blue-600">${sup.totalSO.toLocaleString()} xe <span class="text-[10px] text-slate-400 font-normal">(TB ${sup.avgPerShop} xe/shop)</span></span>
                  </div>
                  <div class="h-3.5 bg-slate-200/70 dark:bg-slate-800 rounded-lg p-0.5">
                    <div class="hbar-3d-bar h-full" style="width:${sup.barPct}%"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- TOP 15 SHOP TĂNG TRƯỞNG / SUY GIẢM -->
        <div class="card-3d p-6 flex flex-col justify-between">
          <div>
            <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 class="font-extrabold text-sm uppercase tracking-wide text-slate-800 dark:text-white flex items-center gap-2">
                <i data-lucide="flame" class="w-4 h-4 text-orange-500"></i>
                Top 15 Shop Biến Động S.O
              </h3>

              <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-extrabold">
                <button
                  onclick="DashboardModule.setTopShopTab('GROWTH')"
                  class="px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    this.topShopTab === 'GROWTH' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                  }"
                >
                  ▲ Top Tăng Trưởng
                </button>
                <button
                  onclick="DashboardModule.setTopShopTab('DECLINE')"
                  class="px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    this.topShopTab === 'DECLINE' ? 'bg-rose-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                  }"
                >
                  ▼ Top Suy Giảm
                </button>
              </div>
            </div>

            <div class="space-y-2 text-xs max-h-[300px] overflow-y-auto pr-1.5">
              ${displayedTopShops.map(s => `
                <div class="flex items-center justify-between p-2.5 rounded-2xl input-3d-well">
                  <div class="truncate pr-2">
                    <button onclick="ShopsModule.openShopModal('${s.dvn}')" class="font-mono font-extrabold text-blue-600 dark:text-blue-400 hover:underline">${s.dvn}</button>
                    <span class="font-bold ml-1.5">${s.name}</span>
                    <div class="text-[11px] text-slate-500 mt-0.5">
                      GS: <strong>${s.supervisor}</strong> • Sale: <strong>${s.sale}</strong>
                    </div>
                  </div>
                  <div class="text-right shrink-0">
                    <div class="font-mono font-extrabold ${s.yoy >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
                      ${s.yoy >= 0 ? '▲ +' + s.yoy + '% YoY' : '▼ ' + s.yoy + '% YoY'}
                    </div>
                    <div class="text-[11px] font-mono font-bold">
                      S.O: ${s.currentSO} xe <span class="text-slate-400 font-normal">(CK: ${s.lastYearSO ?? 'N/A'})</span>
                    </div>
                  </div>
                </div>
              `).join('')}
              ${displayedTopShops.length === 0 ? `
                <div class="py-12 text-center text-slate-400 font-semibold">
                  Chưa có dữ liệu so sánh cùng kỳ (YoY) cho tháng này.
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }
};