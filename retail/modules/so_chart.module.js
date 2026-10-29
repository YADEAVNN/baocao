// modules/so_chart.module.js
window.SOChartModule = {
  subRegionFilter: 'ALL',
  directorFilter: 'ALL',
  saleFilter: 'ALL',
  shopFilter: 'ALL', // Mã DVN chuỗi (String)
  searchQuery: '',
  primaryYear: null,
  compareYear: null,
  isFullscreen: false,

  // Tự động đăng ký vào I18N, Menu nhóm SỐ LIỆU và gắn Hook đồng bộ thanh lọc Header
  initHook() {
    if (window.I18N) {
      if (window.I18N.vi) window.I18N.vi.menu_so_chart = 'Biểu đồ S.O';
      if (window.I18N.zh) window.I18N.zh.menu_so_chart = 'S.O 趋势对比图';
    }

    if (Array.isArray(window.NavigationConfig)) {
      const exists = window.NavigationConfig.some(item => item.id === 'so_chart');
      if (!exists) {
        const selloutIdx = window.NavigationConfig.findIndex(item => item.id === 'sellout');
        const navItem = {
          id: 'so_chart',
          i18nKey: 'menu_so_chart',
          icon: 'bar-chart-big',
          group: 'DATA',
          roles: ['ADMIN', 'REGIONAL_DIRECTOR', 'SUPERVISOR', 'SALE']
        };
        if (selloutIdx >= 0) {
          window.NavigationConfig.splice(selloutIdx + 1, 0, navItem);
        } else {
          window.NavigationConfig.push(navItem);
        }
      }
    }

    // Hook vào OperationsModule (cơ chế fallback mặc định của app.js)
    if (window.OperationsModule && !window.OperationsModule._hookedSOChart) {
      const origRender = window.OperationsModule.render.bind(window.OperationsModule);
      window.OperationsModule.render = (moduleId) => {
        if (moduleId === 'so_chart') {
          return window.SOChartModule.render();
        }
        return origRender(moduleId);
      };
      window.OperationsModule._hookedSOChart = true;
    }

    this.ensureAppNavigationHook();
  },

  // Đảm bảo gắn Hook thành công kể cả khi so_chart.module.js được nạp trước app.js
  ensureAppNavigationHook() {
    if (!window.App) return;

    if (!window.App._hookedSOChartHeaderSync) {
      const origRenderCurrent = window.App.renderCurrentModule.bind(window.App);
      window.App.renderCurrentModule = () => {
        const isSOChart = window.AppState?.activeModule === 'so_chart';
        window.SOChartModule.syncHeaderFilterBar(isSOChart);
        const res = origRenderCurrent();
        window.SOChartModule.syncHeaderFilterBar(window.AppState?.activeModule === 'so_chart');
        return res;
      };

      const origNavigate = window.App.navigate.bind(window.App);
      window.App.navigate = (moduleId) => {
        window.SOChartModule.syncHeaderFilterBar(moduleId === 'so_chart');
        return origNavigate(moduleId);
      };

      window.App._hookedSOChartHeaderSync = true;
    }
  },

  // Ẩn thanh lọc trên Header khi ở Biểu đồ S.O và HIỆN LẠI NGAY khi sang bất kỳ tab nào khác
  syncHeaderFilterBar(shouldHide) {
    const monthSelect = document.getElementById('filter-month-num');
    const filterBarContainer = monthSelect ? monthSelect.closest('.px-6.py-2\\.5') : null;
    const advPanel = document.getElementById('advanced-filters');

    if (filterBarContainer) {
      if (shouldHide) {
        filterBarContainer.classList.add('hidden');
      } else {
        filterBarContainer.classList.remove('hidden');
      }
    }
    if (shouldHide && advPanel) {
      advPanel.classList.add('hidden');
    }
  },

  // Lấy số liệu S.O thô của 1 shop theo Năm & Tháng (Quy tắc 3: Giữ nguyên null nếu chưa có dữ liệu)
  getShopRawSO(rawShop, year, month) {
    if (!rawShop) return null;
    if (window.DashboardModule && typeof window.DashboardModule.getRawSO === 'function') {
      return window.DashboardModule.getRawSO(rawShop, year, month);
    }
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

  // Lấy danh sách Shop tuân thủ phân quyền tài khoản
  getAuthorizedShops() {
    const rawList = window.AdminShopsModule
      ? window.AdminShopsModule.getList()
      : (window.AppStore?.shops || []);

    const role = window.AppState?.role || 'SALE';
    const userRegion = window.AppState?.region || 'ALL';
    const assignedRegion = window.AppState?.assignedRegion || 'ALL';
    const effectiveRegion = role === 'ADMIN' ? userRegion : assignedRegion;

    const userNameNorm = window.AppUtils?.normalizePersonName
      ? window.AppUtils.normalizePersonName(window.AppState?.userName || '')
      : '';

    return rawList
      .map(item => {
        const enumRegion = window.AppUtils?.resolveMienCode
          ? window.AppUtils.resolveMienCode(item.mien, item.region)
          : (String(item.mien || '').toUpperCase().includes('NAM') ? 'SOUTH' : 'NORTH');

        return {
          dvn: String(item.dvn || '').trim(), // Quy tắc 2: Giữ chuẩn String cho mã DVN
          svn: String(item.svn || '').trim(),
          name: item.name || '',
          mien: enumRegion,
          subRegion: item.region || item.subRegion || 'Khác',
          province: item.province || '',
          director: item.gdKhuVuc || item.director || 'Chưa phân công',
          supervisor: item.supervisor || item.gdMien || 'Chưa phân công',
          sale: item.sale || 'Chưa phân công',
          shopType: item.shopType || 'A形象店',
          rawRef: item
        };
      })
      .filter(s => {
        if (effectiveRegion !== 'ALL' && s.mien !== effectiveRegion) return false;
        if (role === 'SALE' && userNameNorm) {
          const saleNorm = window.AppUtils?.normalizePersonName
            ? window.AppUtils.normalizePersonName(s.sale)
            : '';
          if (saleNorm && saleNorm === userNameNorm) return true;
        }
        return true;
      });
  },

  // Phát hiện các năm trong [2025, 2026, 2027, 2028] thực sự có dữ liệu S.O
  getActiveYears(shops) {
    const candidateYears = [2025, 2026, 2027, 2028];
    const active = candidateYears.filter(y =>
      shops.some(s => {
        for (let m = 1; m <= 12; m++) {
          if (this.getShopRawSO(s.rawRef, y, m) !== null) return true;
        }
        return false;
      })
    );
    return active.length > 0 ? active : [2025, 2026];
  },

  // Bộ lọc liên động (Khu vực -> Giám đốc -> Sale -> Shop + Tìm nhanh DVN/Tên)
  setFilter(key, val) {
    this[key] = val;

    if (key === 'subRegionFilter') {
      this.directorFilter = 'ALL';
      this.saleFilter = 'ALL';
      this.shopFilter = 'ALL';
    } else if (key === 'directorFilter') {
      this.saleFilter = 'ALL';
      this.shopFilter = 'ALL';
    } else if (key === 'saleFilter') {
      this.shopFilter = 'ALL';
    }

    window.App.renderCurrentModule();
    if (key === 'searchQuery') {
      const inp = document.getElementById('so-chart-search-input');
      if (inp) {
        inp.focus();
        inp.setSelectionRange(inp.value.length, inp.value.length);
      }
    }
  },

  selectQuickShop(dvnCode) {
    this.shopFilter = String(dvnCode).trim();
    this.searchQuery = '';
    window.App.renderCurrentModule();
  },

  resetFilters() {
    this.subRegionFilter = 'ALL';
    this.directorFilter = 'ALL';
    this.saleFilter = 'ALL';
    this.shopFilter = 'ALL';
    this.searchQuery = '';
    window.App.renderCurrentModule();
  },

  setComparisonYears(primaryY, compareY) {
    if (primaryY !== null) this.primaryYear = Number(primaryY);
    if (compareY !== null) this.compareYear = Number(compareY);
    window.App.renderCurrentModule();
  },

  toggleFullscreen(forceState) {
    this.isFullscreen = typeof forceState === 'boolean' ? forceState : !this.isFullscreen;
    window.App.renderCurrentModule();
  },

  // Tách riêng Thân Cột 3D và Lớp Nhãn Số (Badge) để nhãn số luôn nổi LÊN TRÊN đường Line xu hướng
  create3DPrismParts(cx, baseY, width, height, depthX, depthY, valueText, theme = 'ORANGE', topExtraBadge = '') {
    const x = cx - width / 2;
    const y = baseY - height;

    const gradFront = theme === 'BLUE' ? 'url(#soBlueFront)' : 'url(#soOrangeFront)';
    const actualGradTop = theme === 'BLUE' ? 'url(#soBlueTop)' : 'url(#soOrangeTop)';
    const gradSide = theme === 'BLUE' ? 'url(#soBlueSide)' : 'url(#soOrangeSide)';
    const badgeFill = theme === 'BLUE' ? '#1e40af' : '#c2410c';

    const floorShadow = `<polygon points="${x + 2},${baseY + 2} ${x + width + depthX + 7},${baseY - depthY + 4} ${x + width + depthX + 1},${baseY + 5}" fill="rgba(15, 23, 42, 0.16)" />`;
    const frontRect = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${gradFront}" rx="1.5" />`;
    const topFace = `<polygon points="${x},${y} ${x + depthX},${y - depthY} ${x + width + depthX},${y - depthY} ${x + width},${y}" fill="${actualGradTop}" />`;
    const sideFace = `<polygon points="${x + width},${y} ${x + width + depthX},${y - depthY} ${x + width + depthX},${baseY - depthY} ${x + width},${baseY}" fill="${gradSide}" />`;
    const edgeHighlight = `<line x1="${x + width}" y1="${y}" x2="${x + width}" y2="${baseY}" stroke="rgba(255,255,255,0.55)" stroke-width="0.9" />`;

    // Đẩy nhãn số cao lên trên đường line và tự động mở rộng chiều ngang theo độ dài số
    const labelY = y - depthY - 14;
    const labelCenterX = cx + depthX / 2;
    const strLen = String(valueText || '').length;
    const rectW = Math.max(44, strLen * 6.2 + 10);
    const halfW = rectW / 2;

    const badgeSvg = `
      <g transform="translate(${labelCenterX}, ${labelY})" style="pointer-events: none;">
        <rect x="${-halfW}" y="-10" width="${rectW}" height="15" rx="4" fill="${badgeFill}" stroke="#ffffff" stroke-width="1.2" opacity="0.98" />
        <text x="0" y="0.5" text-anchor="middle" class="text-[8.5px] font-mono font-extrabold fill-white">${valueText}</text>
      </g>
      ${topExtraBadge}
    `;

    return {
      bodySvg: floorShadow + frontRect + topFace + sideFace + edgeHighlight,
      badgeSvg
    };
  },

  // Render SVG Biểu đồ 3D 2 màu: Vẽ Cột -> Vẽ Đường Line -> Vẽ Nhãn Số Nổi Trên Cùng (Không bao giờ bị che số)
  render3DComparisonChartSVG(monthlyStats, primaryYear, compareYear, isLarge = false) {
    let maxVal = 50;
    monthlyStats.forEach(m => {
      if (m.primaryVal !== null && m.primaryVal > maxVal) maxVal = m.primaryVal;
      if (m.compareVal !== null && m.compareVal > maxVal) maxVal = m.compareVal;
    });

    const step = maxVal > 5000 ? 1000 : maxVal > 1000 ? 250 : maxVal > 200 ? 50 : 10;
    const maxScale = Math.ceil((maxVal * 1.28) / step) * step;

    const svgWidth = 940;
    const svgHeight = isLarge ? 405 : 355;
    const baseY = isLarge ? 332 : 290;
    const chartH = isLarge ? 225 : 190;

    let slotBackgroundsSvg = '';
    let barsBodySvg = '';
    let badgesOverlaySvg = '';
    let axisLabelsSvg = '';

    const primarySplinePoints = [];
    const compareSplinePoints = [];
    const primaryDots = [];
    const compareDots = [];

    monthlyStats.forEach((item, idx) => {
      const groupCenterX = 96 + idx * 69;
      const barWidth = 20;
      const depthX = 8;
      const depthY = 6.5;

      const leftBarX = groupCenterX - 13;
      const rightBarX = groupCenterX + 13;

      if (idx % 2 === 0) {
        slotBackgroundsSvg += `<rect x="${groupCenterX - 31}" y="36" width="64" height="${baseY - 36}" rx="6" fill="rgba(148, 163, 184, 0.045)" />`;
      }

      // 1. Cột Năm Đối Chiếu / Cùng Kỳ (Màu Xanh Royal 3D)
      if (item.compareVal !== null) {
        const ratioC = maxScale > 0 ? Math.min(1, item.compareVal / maxScale) : 0;
        const barHC = Math.max(7, Math.round(ratioC * chartH));
        const topYC = baseY - barHC;

        const lineX = leftBarX + depthX / 2;
        const lineY = topYC - depthY / 2;
        compareSplinePoints.push(`${lineX},${lineY}`);
        compareDots.push({ x: lineX, y: lineY });

        const partsC = this.create3DPrismParts(
          leftBarX,
          baseY,
          barWidth,
          barHC,
          depthX,
          depthY,
          item.compareVal.toLocaleString(),
          'BLUE'
        );

        barsBodySvg += `
          <g class="bar-3d-group">
            <title>Tháng ${item.monthLabel}/${compareYear}: ${item.compareVal.toLocaleString()} xe</title>
            ${partsC.bodySvg}
          </g>
        `;
        badgesOverlaySvg += partsC.badgeSvg;
      } else {
        barsBodySvg += `
          <g opacity="0.4">
            <rect x="${leftBarX - barWidth / 2}" y="${baseY - 3}" width="${barWidth}" height="3" rx="1" fill="#94a3b8" />
          </g>
        `;
      }

      // 2. Cột Năm Chính Đang Chọn (Màu Cam YADEA 3D + Huy hiệu % YoY)
      if (item.primaryVal !== null) {
        const ratioP = maxScale > 0 ? Math.min(1, item.primaryVal / maxScale) : 0;
        const barHP = Math.max(7, Math.round(ratioP * chartH));
        const topYP = baseY - barHP;

        const lineX = rightBarX + depthX / 2;
        const lineY = topYP - depthY / 2;
        primarySplinePoints.push(`${lineX},${lineY}`);
        primaryDots.push({ x: lineX, y: lineY });

        let yoyBadgeSvg = '';
        if (item.yoyPct !== null) {
          const isPos = item.yoyPct >= 0;
          const yoyBg = isPos ? '#059669' : '#e11d48';
          const yoyText = `${isPos ? '+' : ''}${item.yoyPct}%`;
          const badgeY = topYP - depthY - 31;
          const yoyW = Math.max(40, yoyText.length * 6 + 10);
          yoyBadgeSvg = `
            <g transform="translate(${rightBarX + depthX / 2}, ${badgeY})" style="pointer-events: none;">
              <rect x="${-yoyW / 2}" y="-9" width="${yoyW}" height="13.5" rx="3.5" fill="${yoyBg}" stroke="#ffffff" stroke-width="1" />
              <text x="0" y="0.5" text-anchor="middle" class="text-[8px] font-mono font-black fill-white">${yoyText}</text>
            </g>
          `;
        }

        const tooltipDiff = item.diffVal !== null
          ? ` (${item.diffVal >= 0 ? '+' : ''}${item.diffVal.toLocaleString()} xe | YoY: ${item.yoyPct !== null ? (item.yoyPct >= 0 ? '+' + item.yoyPct + '%' : item.yoyPct + '%') : '—'})`
          : '';

        const partsP = this.create3DPrismParts(
          rightBarX,
          baseY,
          barWidth,
          barHP,
          depthX,
          depthY,
          item.primaryVal.toLocaleString(),
          'ORANGE',
          yoyBadgeSvg
        );

        barsBodySvg += `
          <g class="bar-3d-group">
            <title>Tháng ${item.monthLabel}/${primaryYear}: ${item.primaryVal.toLocaleString()} xe${tooltipDiff}</title>
            ${partsP.bodySvg}
          </g>
        `;
        badgesOverlaySvg += partsP.badgeSvg;
      } else {
        barsBodySvg += `
          <g opacity="0.4">
            <rect x="${rightBarX - barWidth / 2}" y="${baseY - 3}" width="${barWidth}" height="3" rx="1" fill="#cbd5e1" />
          </g>
        `;
      }

      axisLabelsSvg += `
        <g>
          <text x="${groupCenterX}" y="${baseY + 22}" text-anchor="middle" class="text-[11px] font-extrabold fill-slate-700 dark:fill-slate-200">${item.monthLabel}</text>
          ${item.diffVal !== null ? `
            <text x="${groupCenterX}" y="${baseY + 35}" text-anchor="middle" class="text-[9.5px] font-mono font-bold ${item.diffVal >= 0 ? 'fill-emerald-600' : 'fill-rose-600'}">
              ${item.diffVal >= 0 ? '+' : ''}${item.diffVal.toLocaleString()}
            </text>
          ` : `
            <text x="${groupCenterX}" y="${baseY + 35}" text-anchor="middle" class="text-[9px] font-mono fill-slate-400">—</text>
          `}
        </g>
      `;
    });

    const gridLevels = [1, 0.75, 0.5, 0.25, 0];
    const gridSvg = gridLevels.map(lv => {
      const yPos = Math.round(baseY - lv * chartH);
      const valLabel = Math.round(maxScale * lv).toLocaleString();
      return `
        <g transform="translate(0, ${yPos})">
          <text x="54" y="4" text-anchor="end" class="text-[10px] font-mono font-bold fill-slate-400">${valLabel}</text>
          ${lv > 0 ? `<line x1="62" y1="0" x2="915" y2="0" stroke="currentColor" stroke-opacity="0.14" stroke-dasharray="4 4" />` : ''}
        </g>
      `;
    }).join('');

    return `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="w-full h-auto min-w-[760px] select-none">
        <defs>
          <linearGradient id="soOrangeFront" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#fb923c" />
            <stop offset="50%" stop-color="#F26522" />
            <stop offset="100%" stop-color="#c2410c" />
          </linearGradient>
          <linearGradient id="soOrangeTop" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#ffedd5" />
            <stop offset="100%" stop-color="#fdba74" />
          </linearGradient>
          <linearGradient id="soOrangeSide" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ea580c" />
            <stop offset="100%" stop-color="#7c2d12" />
          </linearGradient>

          <linearGradient id="soBlueFront" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#60a5fa" />
            <stop offset="50%" stop-color="#2563eb" />
            <stop offset="100%" stop-color="#1e3a8a" />
          </linearGradient>
          <linearGradient id="soBlueTop" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#dbeafe" />
            <stop offset="100%" stop-color="#93c5fd" />
          </linearGradient>
          <linearGradient id="soBlueSide" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1d4ed8" />
            <stop offset="100%" stop-color="#172554" />
          </linearGradient>

          <linearGradient id="soFloorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="rgba(148, 163, 184, 0.14)" />
            <stop offset="100%" stop-color="rgba(148, 163, 184, 0.32)" />
          </linearGradient>
        </defs>

        <!-- LỚP 1: Lưới ngang & Trục tung -->
        <g class="text-slate-400">
          ${gridSvg}
        </g>

        <!-- LỚP 2: Nền cột tháng & Mặt sàn 3D Isometric -->
        ${slotBackgroundsSvg}
        <polygon points="62,${baseY} 76,${baseY - 10} 926,${baseY - 10} 915,${baseY}" fill="url(#soFloorGrad)" />
        <rect x="62" y="${baseY}" width="853" height="5" rx="2" fill="rgba(148, 163, 184, 0.38)" />

        <!-- LỚP 3: Thân các cặp cột 3D 12 tháng -->
        ${barsBodySvg}

        <!-- LỚP 4: Đường xu hướng (Nằm dưới các hộp nhãn số để không bao giờ che khuất số) -->
        ${compareSplinePoints.length > 1 ? `
          <polyline points="${compareSplinePoints.join(' ')}" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="4 3" stroke-linecap="round" stroke-linejoin="round" opacity="0.85" />
          ${compareDots.map(d => `<circle cx="${d.x}" cy="${d.y}" r="2.8" fill="#1d4ed8" stroke="#ffffff" stroke-width="1.2" />`).join('')}
        ` : ''}
        ${primarySplinePoints.length > 1 ? `
          <polyline points="${primarySplinePoints.join(' ')}" fill="none" stroke="#10b981" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
          ${primaryDots.map(d => `<circle cx="${d.x}" cy="${d.y}" r="3.2" fill="#059669" stroke="#ffffff" stroke-width="1.4" />`).join('')}
        ` : ''}

        <!-- LỚP 5 (TRÊN CÙNG): Toàn bộ hộp số liệu S.O & Huy hiệu % YoY sắc nét -->
        ${badgesOverlaySvg}

        <!-- LỚP 6: Nhãn tháng & Chênh lệch dưới trục hoành -->
        ${axisLabelsSvg}
      </svg>
    `;
  },

  render() {
    // Đảm bảo gắn hook điều hướng vào App và ẩn thanh lọc trên Header khi ở trang Biểu đồ S.O
    this.ensureAppNavigationHook();
    this.syncHeaderFilterBar(true);

    const authorizedShops = this.getAuthorizedShops();
    const activeYears = this.getActiveYears(authorizedShops);

    if (!this.primaryYear || !activeYears.includes(this.primaryYear)) {
      this.primaryYear = activeYears.includes(2026) ? 2026 : activeYears[activeYears.length - 1];
    }
    if (!this.compareYear || !activeYears.includes(this.compareYear) || this.compareYear === this.primaryYear) {
      const prevCandidate = this.primaryYear - 1;
      if (activeYears.includes(prevCandidate)) {
        this.compareYear = prevCandidate;
      } else {
        this.compareYear = activeYears.find(y => y !== this.primaryYear) || (this.primaryYear - 1);
      }
    }

    const subRegions = [...new Set(authorizedShops.map(s => s.subRegion).filter(Boolean))].sort();

    const shopsBySubRegion = authorizedShops.filter(s =>
      this.subRegionFilter === 'ALL' || s.subRegion === this.subRegionFilter
    );
    const directors = [...new Set(shopsBySubRegion.map(s => s.director).filter(Boolean))].sort();

    const shopsByDirector = shopsBySubRegion.filter(s =>
      this.directorFilter === 'ALL' || s.director === this.directorFilter
    );
    const sales = [...new Set(shopsByDirector.map(s => s.sale).filter(Boolean))].sort();

    const shopsBySale = shopsByDirector
      .filter(s => this.saleFilter === 'ALL' || s.sale === this.saleFilter)
      .sort((a, b) => String(a.dvn).localeCompare(String(b.dvn)));

    const q = this.searchQuery.trim().toLowerCase();
    const filteredShops = shopsBySale.filter(s => {
      const matchShop = this.shopFilter === 'ALL' || String(s.dvn) === String(this.shopFilter);
      const matchQuery = !q ||
        String(s.dvn).toLowerCase().includes(q) ||
        String(s.name).toLowerCase().includes(q) ||
        String(s.province).toLowerCase().includes(q);
      return matchShop && matchQuery;
    });

    const quickSearchSuggestions = q.length > 0
      ? shopsBySale.filter(s =>
          String(s.dvn).toLowerCase().includes(q) ||
          String(s.name).toLowerCase().includes(q)
        ).slice(0, 8)
      : [];

    const yearlyMonthlyMatrix = {};
    activeYears.forEach(y => {
      yearlyMonthlyMatrix[y] = Array(12).fill(null);
    });

    for (let m = 1; m <= 12; m++) {
      activeYears.forEach(y => {
        let sumM = 0;
        let hasAnyData = false;
        filteredShops.forEach(s => {
          const v = this.getShopRawSO(s.rawRef, y, m);
          if (v !== null && v !== undefined) {
            sumM += v;
            hasAnyData = true;
          }
        });
        yearlyMonthlyMatrix[y][m - 1] = hasAnyData ? sumM : null;
      });
    }

    const monthlyStats = [];
    let totalPrimaryFullYear = 0;
    let totalCompareFullYear = 0;
    let comparablePrimarySum = 0;
    let comparableCompareSum = 0;
    let comparableMonthsCount = 0;

    for (let m = 1; m <= 12; m++) {
      const pVal = yearlyMonthlyMatrix[this.primaryYear]?.[m - 1] ?? null;
      const cVal = yearlyMonthlyMatrix[this.compareYear]?.[m - 1] ?? null;

      if (pVal !== null) totalPrimaryFullYear += pVal;
      if (cVal !== null) totalCompareFullYear += cVal;

      let diffVal = null;
      let yoyPct = null;

      if (pVal !== null && cVal !== null) {
        diffVal = pVal - cVal;
        comparablePrimarySum += pVal;
        comparableCompareSum += cVal;
        comparableMonthsCount++;
        if (cVal > 0) {
          yoyPct = Math.round(((pVal - cVal) / cVal) * 100);
        }
      }

      monthlyStats.push({
        month: m,
        monthLabel: `T${m < 10 ? '0' + m : m}`,
        primaryVal: pVal,
        compareVal: cVal,
        diffVal,
        yoyPct
      });
    }

    const totalComparableDiff = comparableMonthsCount > 0
      ? (comparablePrimarySum - comparableCompareSum)
      : null;
    const totalComparableYoY = (comparableMonthsCount > 0 && comparableCompareSum > 0)
      ? (((comparablePrimarySum - comparableCompareSum) / comparableCompareSum) * 100).toFixed(1)
      : null;

    const selectedShopObj = this.shopFilter !== 'ALL'
      ? authorizedShops.find(s => String(s.dvn) === String(this.shopFilter))
      : null;

    const scopeLabel = selectedShopObj
      ? `${selectedShopObj.dvn} - ${selectedShopObj.name} (${selectedShopObj.province})`
      : this.saleFilter !== 'ALL'
      ? `Sale: ${this.saleFilter} (${filteredShops.length} Shop)`
      : this.directorFilter !== 'ALL'
      ? `GĐKV: ${this.directorFilter} (${filteredShops.length} Shop)`
      : this.subRegionFilter !== 'ALL'
      ? `Khu vực: ${this.subRegionFilter} (${filteredShops.length} Shop)`
      : `Toàn bộ phạm vi (${filteredShops.length} Shop)`;

    const hasActiveFilter =
      this.subRegionFilter !== 'ALL' ||
      this.directorFilter !== 'ALL' ||
      this.saleFilter !== 'ALL' ||
      this.shopFilter !== 'ALL' ||
      this.searchQuery.trim() !== '';

    return `
      <div class="space-y-5">
        <!-- 1. HEADER & BỘ LỌC LIÊN ĐỘNG 4 CẤP + TÌM NHANH DVN -->
        <div class="card-3d p-5 space-y-4 bg-white dark:bg-slate-900 border-t-4 border-t-[#F26522]">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-2.5 py-1 rounded-lg bg-[#F26522] text-white text-xs font-black uppercase tracking-wider">
                  3D S.O ANALYTICS
                </span>
                <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase">
                  Biểu Đồ So Sánh Sản Lượng Sell-Out & Tăng Trưởng Cùng Kỳ (YoY)
                </h2>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                Đang xem: <strong class="text-[#F26522]">${scopeLabel}</strong> • Các năm có dữ liệu hệ thống: <strong>${activeYears.join(', ')}</strong>
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2 text-xs">
              <!-- Chọn Năm Chính & Năm Đối Chiếu -->
              <div class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold">
                <span class="w-2.5 h-2.5 rounded-sm bg-[#F26522] inline-block"></span>
                <span class="text-slate-500">Năm chính:</span>
                <select
                  onchange="SOChartModule.setComparisonYears(this.value, null)"
                  class="bg-transparent font-black text-[#F26522] focus:outline-none cursor-pointer"
                >
                  ${activeYears.map(y => `<option value="${y}" ${this.primaryYear === y ? 'selected' : ''} class="text-black">Năm ${y}</option>`).join('')}
                </select>

                <span class="text-slate-300 mx-1">vs</span>

                <span class="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block"></span>
                <span class="text-slate-500">Cùng kỳ:</span>
                <select
                  onchange="SOChartModule.setComparisonYears(null, this.value)"
                  class="bg-transparent font-black text-blue-600 focus:outline-none cursor-pointer"
                >
                  ${activeYears.map(y => `<option value="${y}" ${this.compareYear === y ? 'selected' : ''} class="text-black">Năm ${y}</option>`).join('')}
                </select>
              </div>

              <!-- Nút Phóng To Trình Chiếu Đại Lý -->
              <button
                type="button"
                onclick="SOChartModule.toggleFullscreen(true)"
                class="btn-3d-orange px-4 py-2 rounded-xl font-extrabold flex items-center gap-2 cursor-pointer"
                title="Phóng to biểu đồ toàn màn hình để trình bày với Đại lý"
              >
                <i class="fa-solid fa-expand"></i>
                <span>Phóng To Trình Bày Đại Lý</span>
              </button>
            </div>
          </div>

          <!-- BỘ LỌC LIÊN ĐỘNG: KHU VỰC -> GIÁM ĐỐC -> SALE -> SHOP + TÌM KIẾM NHANH DVN -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
            <div>
              <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">1. Khu Vực (区域)</label>
              <select
                onchange="SOChartModule.setFilter('subRegionFilter', this.value)"
                class="w-full p-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 font-bold text-orange-600 focus:outline-none focus:border-[#F26522] cursor-pointer"
              >
                <option value="ALL">-- Tất cả Khu vực (${subRegions.length}) --</option>
                ${subRegions.map(reg => `<option value="${reg}" ${this.subRegionFilter === reg ? 'selected' : ''}>${reg}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">2. Giám Đốc Khu Vực</label>
              <select
                onchange="SOChartModule.setFilter('directorFilter', this.value)"
                class="w-full p-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F26522] cursor-pointer"
              >
                <option value="ALL">-- Tất cả Giám đốc (${directors.length}) --</option>
                ${directors.map(dir => `<option value="${dir}" ${this.directorFilter === dir ? 'selected' : ''}>${dir}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">3. Nhân Viên Sale</label>
              <select
                onchange="SOChartModule.setFilter('saleFilter', this.value)"
                class="w-full p-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 font-bold text-blue-600 focus:outline-none focus:border-[#F26522] cursor-pointer"
              >
                <option value="ALL">-- Tất cả Sale (${sales.length}) --</option>
                ${sales.map(sl => {
                  const cnt = shopsByDirector.filter(x => x.sale === sl).length;
                  return `<option value="${sl}" ${this.saleFilter === sl ? 'selected' : ''}>${sl} (${cnt} shop)</option>`;
                }).join('')}
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                4. Chọn Cửa Hàng (${shopsBySale.length} Shop)
              </label>
              <select
                onchange="SOChartModule.setFilter('shopFilter', this.value)"
                class="w-full p-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#F26522] cursor-pointer"
              >
                <option value="ALL">-- Tất cả Shop trong nhóm (${shopsBySale.length}) --</option>
                ${shopsBySale.map(sh => `
                  <option value="${sh.dvn}" ${String(this.shopFilter) === String(sh.dvn) ? 'selected' : ''}>
                    ${sh.dvn} - ${sh.name}
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="relative">
              <div class="flex items-center justify-between mb-1">
                <label class="block text-[10px] font-extrabold uppercase text-slate-400">5. Tìm Nhanh DVN / Tên</label>
                ${hasActiveFilter ? `
                  <button
                    type="button"
                    onclick="SOChartModule.resetFilters()"
                    class="text-[10px] font-extrabold text-rose-600 hover:underline cursor-pointer"
                  >
                    Đặt lại lọc
                  </button>
                ` : ''}
              </div>
              <div class="relative">
                <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input
                  id="so-chart-search-input"
                  type="text"
                  value="${this.searchQuery}"
                  oninput="SOChartModule.setFilter('searchQuery', this.value)"
                  placeholder="Gõ mã DVN hoặc tên đại lý..."
                  class="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 font-semibold focus:outline-none focus:border-[#F26522]"
                />
              </div>

              ${quickSearchSuggestions.length > 0 ? `
                <div class="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                  ${quickSearchSuggestions.map(item => `
                    <button
                      type="button"
                      onclick="SOChartModule.selectQuickShop('${item.dvn}')"
                      class="w-full px-3 py-2 text-left hover:bg-orange-50 flex items-center justify-between gap-2 transition cursor-pointer"
                    >
                      <div class="truncate">
                        <span class="font-mono font-black text-blue-600">${item.dvn}</span>
                        <span class="font-bold text-slate-800 ml-1">${item.name}</span>
                      </div>
                      <span class="text-[10px] text-slate-400 shrink-0">${item.province}</span>
                    </button>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- 2. 4 THẺ TỔNG HỢP SẢN LƯỢNG & TĂNG TRƯỞNG CÙNG KỲ (YoY) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="card-3d tilt-card p-4 border-t-4 border-t-[#F26522]">
            <div class="flex items-center justify-between text-[11px] font-extrabold uppercase text-slate-500">
              <span>TỔNG S.O NĂM ${this.primaryYear}</span>
              <span class="px-2 py-0.5 rounded bg-orange-100 text-[#F26522] font-mono text-[10px]">Cột Cam 3D</span>
            </div>
            <div class="my-1.5 text-2xl font-black font-mono text-[#F26522]">${totalPrimaryFullYear.toLocaleString()} xe</div>
            <div class="text-[11px] text-slate-500">
              Trung bình: <strong>${filteredShops.length > 0 ? (totalPrimaryFullYear / filteredShops.length).toFixed(1) : 0} xe/shop</strong> (${filteredShops.length} shop)
            </div>
          </div>

          <div class="card-3d tilt-card p-4 border-t-4 border-t-blue-600">
            <div class="flex items-center justify-between text-[11px] font-extrabold uppercase text-slate-500">
              <span>TỔNG S.O NĂM ${this.compareYear}</span>
              <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-mono text-[10px]">Cột Xanh 3D</span>
            </div>
            <div class="my-1.5 text-2xl font-black font-mono text-blue-600">${totalCompareFullYear.toLocaleString()} xe</div>
            <div class="text-[11px] text-slate-500">
              Cùng kỳ ${comparableMonthsCount} tháng có đối chiếu: <strong>${comparableCompareSum.toLocaleString()} xe</strong>
            </div>
          </div>

          <div class="card-3d tilt-card p-4 border-t-4 ${totalComparableDiff !== null && totalComparableDiff >= 0 ? 'border-t-emerald-500' : 'border-t-rose-500'}">
            <div class="flex items-center justify-between text-[11px] font-extrabold uppercase text-slate-500">
              <span>CHÊNH LỆCH XE CÙNG KỲ (${this.primaryYear} vs ${this.compareYear})</span>
              <i data-lucide="arrow-up-down" class="w-4 h-4 ${totalComparableDiff !== null && totalComparableDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}"></i>
            </div>
            <div class="my-1.5 text-2xl font-black font-mono ${totalComparableDiff === null ? 'text-slate-400' : totalComparableDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
              ${totalComparableDiff === null ? 'Chưa đủ DL' : `${totalComparableDiff >= 0 ? '+' : ''}${totalComparableDiff.toLocaleString()} xe`}
            </div>
            <div class="text-[11px] text-slate-500">
              Tính trên ${comparableMonthsCount} tháng có đủ dữ liệu cả 2 năm
            </div>
          </div>

          <div class="card-3d tilt-card p-4 border-t-4 ${totalComparableYoY !== null && Number(totalComparableYoY) >= 0 ? 'border-t-emerald-500' : 'border-t-rose-500'}">
            <div class="flex items-center justify-between text-[11px] font-extrabold uppercase text-slate-500">
              <span>TỶ LỆ TĂNG TRƯỞNG CÙNG KỲ (YoY)</span>
              <i data-lucide="trending-up" class="w-4 h-4 ${totalComparableYoY !== null && Number(totalComparableYoY) >= 0 ? 'text-emerald-600' : 'text-rose-600'}"></i>
            </div>
            <div class="my-1.5 text-2xl font-black font-mono ${totalComparableYoY === null ? 'text-slate-400' : Number(totalComparableYoY) >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
              ${totalComparableYoY === null ? 'Chưa đủ DL' : `${Number(totalComparableYoY) >= 0 ? '+' : ''}${totalComparableYoY}%`}
            </div>
            <div class="text-[11px] text-slate-500">
              Lũy kế cùng kỳ: ${comparablePrimarySum.toLocaleString()} vs ${comparableCompareSum.toLocaleString()} xe
            </div>
          </div>
        </div>

        <!-- 3. BIỂU ĐỒ CỘT 3D VOLUMETRIC 2 MÀU SO SÁNH 12 THÁNG -->
        <div class="card-3d p-6 bg-white dark:bg-slate-900 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="font-extrabold text-sm sm:text-base uppercase tracking-wide text-slate-800 dark:text-white flex items-center gap-2">
                <i data-lucide="bar-chart-big" class="w-5 h-5 text-[#F26522]"></i>
                BIỂU ĐỒ 3D SO SÁNH S.O 12 THÁNG (NĂM ${this.primaryYear} VS NĂM ${this.compareYear}) — ĐƠN VỊ: XE
              </h3>
              <p class="text-[11px] text-slate-400">
                Mỗi tháng hiển thị 2 cột 3D riêng biệt: Cột Xanh (Năm ${this.compareYear}) & Cột Cam (Năm ${this.primaryYear}) kèm huy hiệu % YoY nổi rõ phía trên đường xu hướng
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-4 text-xs font-bold">
              <span class="flex items-center gap-1.5">
                <span class="w-3.5 h-3.5 rounded bg-blue-600 inline-block shadow-sm"></span>
                <span>S.O Năm ${this.compareYear}</span>
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-3.5 h-3.5 rounded bg-[#F26522] inline-block shadow-sm"></span>
                <span>S.O Năm ${this.primaryYear}</span>
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                <span>Đường xu hướng ${this.primaryYear}</span>
              </span>
              <button
                type="button"
                onclick="SOChartModule.toggleFullscreen(true)"
                class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold flex items-center gap-1.5 transition cursor-pointer"
              >
                <i class="fa-solid fa-maximize text-[#F26522]"></i>
                <span>Phóng to</span>
              </button>
            </div>
          </div>

          <div class="w-full overflow-x-auto pt-1">
            ${this.render3DComparisonChartSVG(monthlyStats, this.primaryYear, this.compareYear, false)}
          </div>
        </div>

        <!-- 4. BẢNG SỐ LIỆU CHI TIẾT 12 THÁNG & TỔNG S.O TỪNG NĂM -->
        <div class="card-3d overflow-hidden bg-white dark:bg-slate-900">
          <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 class="font-extrabold text-sm uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <i class="fa-solid fa-table text-[#F26522]"></i>
                Bảng Số Liệu Chi Tiết 12 Tháng & Tổng S.O Các Năm (${activeYears.join(' - ')})
              </h3>
              <p class="text-[11px] text-slate-500">
                Hiển thị đầy đủ các năm có dữ liệu thực tế, chênh lệch số xe (+/-) và tỷ lệ % tăng trưởng cùng kỳ (YoY)
              </p>
            </div>
            <span class="px-3 py-1 rounded-lg bg-orange-50 text-[#F26522] text-xs font-extrabold">
              Phạm vi: ${scopeLabel}
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-right border-collapse text-xs">
              <thead>
                <tr class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase font-extrabold border-b">
                  <th class="py-3.5 px-4 text-left sticky left-0 bg-slate-100 dark:bg-slate-800 z-10 min-w-[190px]">
                    Chỉ Tiêu / Năm Dữ Liệu
                  </th>
                  ${monthlyStats.map(m => `<th class="py-3.5 px-2.5 text-center font-mono">${m.monthLabel}</th>`).join('')}
                  <th class="py-3.5 px-4 text-right bg-orange-50 dark:bg-slate-700 text-[#F26522] font-black">
                    TỔNG NĂM
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                ${activeYears.map(y => {
                  const rowVals = yearlyMonthlyMatrix[y] || Array(12).fill(null);
                  const sumY = rowVals.reduce((acc, v) => acc + (v !== null ? v : 0), 0);
                  const hasAnyY = rowVals.some(v => v !== null);
                  const isPrimary = y === this.primaryYear;
                  const isCompare = y === this.compareYear;

                  return `
                    <tr class="${isPrimary ? 'bg-orange-50/40 dark:bg-orange-950/20 font-extrabold' : 'hover:bg-slate-50'}">
                      <td class="py-3 px-4 text-left font-sans font-extrabold sticky left-0 bg-white dark:bg-slate-900 z-10 flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-sm ${isPrimary ? 'bg-[#F26522]' : isCompare ? 'bg-blue-600' : 'bg-slate-400'}"></span>
                        <span class="text-slate-900 dark:text-white">Sản lượng S.O Năm ${y}</span>
                      </td>
                      ${rowVals.map(v => `
                        <td class="py-3 px-2.5 text-center ${v === null ? 'text-slate-300 font-normal' : isPrimary ? 'text-[#F26522] font-black' : isCompare ? 'text-blue-600 font-bold' : 'text-slate-700'}">
                          ${v === null ? '—' : v.toLocaleString()}
                        </td>
                      `).join('')}
                      <td class="py-3 px-4 text-right font-black text-sm bg-orange-50/50 dark:bg-slate-800 ${isPrimary ? 'text-[#F26522]' : 'text-slate-900 dark:text-white'}">
                        ${hasAnyY ? sumY.toLocaleString() + ' xe' : '—'}
                      </td>
                    </tr>
                  `;
                }).join('')}

                <!-- Dòng Tăng / Giảm số xe (Cùng kỳ) -->
                <tr class="bg-slate-50/90 dark:bg-slate-800/50 font-bold border-t-2 border-slate-200">
                  <td class="py-3 px-4 text-left font-sans font-extrabold text-slate-700 dark:text-slate-200 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10">
                    Chênh lệch (${this.primaryYear} vs ${this.compareYear}) [Xe]
                  </td>
                  ${monthlyStats.map(m => `
                    <td class="py-3 px-2.5 text-center ${m.diffVal === null ? 'text-slate-300' : m.diffVal >= 0 ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold'}">
                      ${m.diffVal === null ? '—' : `${m.diffVal >= 0 ? '+' : ''}${m.diffVal.toLocaleString()}`}
                    </td>
                  `).join('')}
                  <td class="py-3 px-4 text-right font-black ${totalComparableDiff === null ? 'text-slate-400' : totalComparableDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
                    ${totalComparableDiff === null ? '—' : `${totalComparableDiff >= 0 ? '+' : ''}${totalComparableDiff.toLocaleString()} xe`}
                  </td>
                </tr>

                <!-- Dòng Tỷ lệ % tăng trưởng cùng kỳ YoY -->
                <tr class="bg-slate-50/90 dark:bg-slate-800/50 font-bold">
                  <td class="py-3 px-4 text-left font-sans font-extrabold text-slate-700 dark:text-slate-200 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10">
                    Tăng trưởng YoY (${this.primaryYear} / ${this.compareYear}) [%]
                  </td>
                  ${monthlyStats.map(m => `
                    <td class="py-3 px-2.5 text-center">
                      ${m.yoyPct === null ? `<span class="text-slate-300">—</span>` : `
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-black ${m.yoyPct >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
                          ${m.yoyPct >= 0 ? '+' : ''}${m.yoyPct}%
                        </span>
                      `}
                    </td>
                  `).join('')}
                  <td class="py-3 px-4 text-right font-black ${totalComparableYoY === null ? 'text-slate-400' : Number(totalComparableYoY) >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
                    ${totalComparableYoY === null ? '—' : `${Number(totalComparableYoY) >= 0 ? '+' : ''}${totalComparableYoY}%`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 5. MODAL PHÓNG TO TOÀN MÀN HÌNH ĐỂ GIÁM SÁT TRÌNH BÀY CHO ĐẠI LÝ -->
      ${this.isFullscreen ? `
        <div class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div class="card-3d w-full max-w-7xl bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl max-h-[95vh] overflow-y-auto space-y-5 border-2 border-[#F26522]/40 shadow-2xl">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div class="flex items-center gap-2">
                  <span class="px-3 py-1 rounded-lg bg-[#F26522] text-white text-xs font-black uppercase">
                    CHẾ ĐỘ TRÌNH CHIẾU ĐẠI LÝ
                  </span>
                  <h3 class="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase">
                    ${scopeLabel}
                  </h3>
                </div>
                <p class="text-xs text-slate-500 mt-1">
                  So sánh trực tiếp sản lượng Sell-out 12 tháng giữa <strong>Năm ${this.primaryYear} (Cam 3D)</strong> và <strong>Năm ${this.compareYear} (Xanh 3D)</strong>
                </p>
              </div>

              <div class="flex items-center gap-3">
                <div class="hidden sm:flex items-center gap-3 text-xs font-extrabold mr-2">
                  <span class="px-3 py-1.5 rounded-xl bg-orange-50 text-[#F26522] border border-orange-200">
                    Năm ${this.primaryYear}: ${totalPrimaryFullYear.toLocaleString()} xe
                  </span>
                  <span class="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                    Năm ${this.compareYear}: ${totalCompareFullYear.toLocaleString()} xe
                  </span>
                  ${totalComparableYoY !== null ? `
                    <span class="px-3 py-1.5 rounded-xl ${Number(totalComparableYoY) >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'} border">
                      YoY cùng kỳ: ${Number(totalComparableYoY) >= 0 ? '+' : ''}${totalComparableYoY}% (${totalComparableDiff >= 0 ? '+' : ''}${totalComparableDiff.toLocaleString()} xe)
                    </span>
                  ` : ''}
                </div>

                <button
                  type="button"
                  onclick="SOChartModule.toggleFullscreen(false)"
                  class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-rose-600 text-white text-xs font-extrabold flex items-center gap-2 transition cursor-pointer"
                >
                  <i class="fa-solid fa-compress"></i>
                  <span>Thu Nhỏ (Đóng)</span>
                </button>
              </div>
            </div>

            <div class="w-full overflow-x-auto py-2">
              ${this.render3DComparisonChartSVG(monthlyStats, this.primaryYear, this.compareYear, true)}
            </div>

            <div class="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
              ${monthlyStats.map(m => `
                <div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70">
                  <div class="font-extrabold text-slate-700 dark:text-slate-200">${m.monthLabel}</div>
                  <div class="font-mono font-black text-[#F26522] text-sm mt-0.5">${m.primaryVal !== null ? m.primaryVal.toLocaleString() : '—'}</div>
                  <div class="font-mono text-[10px] text-blue-600 font-bold">CK: ${m.compareVal !== null ? m.compareVal.toLocaleString() : '—'}</div>
                  <div class="font-mono text-[10px] font-black mt-0.5 ${m.yoyPct === null ? 'text-slate-400' : m.yoyPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
                    ${m.yoyPct === null ? '—' : `${m.yoyPct >= 0 ? '+' : ''}${m.yoyPct}%`}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      ` : ''}
    `;
  }
};

window.SOChartModule.initHook();
window.addEventListener('DOMContentLoaded', () => window.SOChartModule.ensureAppNavigationHook());