import { removeVietnameseTones, fmn, $, safeVal } from '../core/utils.js';
import { calcKPI } from '../core/calculator.js';
import { sb } from '../core/supabase.js';

let mapRoot = null; 

export async function loadHeatmap() {
    // 1. ĐỊNH NGHĨA MAPPING TỈNH THÀNH (63 -> 34)
    const provinceMapping = {
        "tuyen quang": "tuyen quang", "ha giang": "tuyen quang",
        "lao cai": "lao cai", "yen bai": "lao cai",
        "bac kan": "thai nguyen", "thai nguyen": "thai nguyen",
        "vinh phuc": "phu tho", "phu tho": "phu tho", "hoa binh": "phu tho",
        "bac ninh": "bac ninh", "bac giang": "bac ninh",
        "hung yen": "hung yen", "thai binh": "hung yen",
        "hai duong": "hai phong", "hai phong": "hai phong",
        "ha nam": "ninh binh", "ninh binh": "ninh binh", "nam dinh": "ninh binh",
        "quang binh": "quang tri", "quang tri": "quang tri",
        "quang nam": "da nang", "da nang": "da nang",
        "kon tum": "quang ngai", "quang ngai": "quang ngai",
        "gia lai": "gia lai", "binh dinh": "gia lai",
        "ninh thuan": "khanh hoa", "khanh hoa": "khanh hoa",
        "lam dong": "lam dong", "dak nong": "lam dong", "binh thuan": "lam dong",
        "dak lak": "dak lak", "phu yen": "dak lak",
        "ba ria vung tau": "ho chi minh", "binh duong": "ho chi minh", "ho chi minh": "ho chi minh",
        "dong nai": "dong nai", "binh phuoc": "dong nai",
        "tay ninh": "tay ninh", "long an": "tay ninh",
        "can tho": "can tho", "soc trang": "can tho", "hau giang": "can tho",
        "ben tre": "vinh long", "vinh long": "vinh long", "tra vinh": "vinh long",
        "tien giang": "dong thap", "dong thap": "dong thap",
        "bac lieu": "ca mau", "ca mau": "ca mau",
        "an giang": "an giang", "kien giang": "an giang",
        "ha noi": "ha noi", "ha tay": "ha noi",
        "thua thien hue": "thanh pho hue", "hue": "thanh pho hue",
        "lai chau": "lai chau", "dien bien": "dien bien", "son la": "son la", 
        "lang son": "lang son", "quang ninh": "quang ninh", "thanh hoa": "thanh hoa", 
        "nghe an": "nghe an", "ha tinh": "ha tinh", "cao bang": "cao bang"
    };

    // 2. LẤY DỮ LIỆU TỪ SUPABASE (Cho tháng hiện tại đang chọn)
    const month = $('f_month').value + "-01"; // Lấy tháng từ ô input Dashboard
    
    // Chúng ta cần lấy cả Report và thông tin Shop để biết Tỉnh thành
    const { data: reports, error } = await sb.from('financial_reports').select('*').eq('report_month', month);
    
    if (error || !reports || reports.length === 0) {
        console.warn("Không có dữ liệu bản đồ hoặc lỗi:", error);
        // Vẫn vẽ bản đồ nền (trống) nếu không có dữ liệu
    }

    // Lấy thông tin Master Shop để map Province
    // Lưu ý: window.globalAdminShopMap đã được load ở main.js, ta dùng lại luôn
    const shopMap = window.globalAdminShopMap || {};

    // 3. TỔNG HỢP DỮ LIỆU LÃI/LỖ
    const provinceProfitMap = {};
    
    if (reports) {
        reports.forEach(r => {
            const shop = shopMap[r.shop_code];
            if (shop && shop.province) {
                const dbNameNorm = removeVietnameseTones(shop.province).toLowerCase().trim();
                let targetProvinceName = dbNameNorm;
                
                // Map về 34 tỉnh chuẩn
                for (const [oldName, newName] of Object.entries(provinceMapping)) {
                    if (dbNameNorm.includes(oldName) || oldName.includes(dbNameNorm)) {
                        targetProvinceName = newName;
                        break;
                    }
                }

                const k = calcKPI(r); // Tính lãi lỗ
                if (!provinceProfitMap[targetProvinceName]) provinceProfitMap[targetProvinceName] = 0;
                provinceProfitMap[targetProvinceName] += k.net;
            }
        });
    }

    // 4. VẼ BẢN ĐỒ (amCharts 5)
    if (mapRoot) return; // Nếu đã vẽ rồi thì thôi

    am5.ready(function() {
        mapRoot = am5.Root.new("chartdiv");
        mapRoot.setThemes([am5themes_Animated.new(mapRoot)]);

        // Tạo Map Chart
        var chart = mapRoot.container.children.push(am5map.MapChart.new(mapRoot, {
            panX: "rotateX",
            panY: "rotateY",
            projection: am5map.geoOrthographic(), // Dạng quả địa cầu 3D
            homeGeoPoint: { latitude: 16, longitude: 106 }, // Tâm Việt Nam
            homeZoomLevel: 4
        }));

        // Layer nền biển đại dương (Cho đẹp)
        var backgroundSeries = chart.series.push(am5map.MapPolygonSeries.new(mapRoot, {}));
        backgroundSeries.mapPolygons.template.setAll({ fill: am5.color(0x222222), stroke: am5.color(0x222222) });
        backgroundSeries.data.push({ geometry: am5map.getGeoRectangle(90, 180, -90, -180) });

        // Layer Bản đồ Việt Nam
        var polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(mapRoot, {
            geoJSON: am5geodata_vietnamLow, 
            exclude: ["AQ"] // Loại bỏ Nam Cực nếu có
        }));

        // Cấu hình Polygon (Tỉnh)
        polygonSeries.mapPolygons.template.setAll({
            tooltipText: "{name}",
            toggleKey: "active",
            interactive: true,
            stroke: am5.color(0x000000),
            strokeWidth: 1,
            fillOpacity: 1
        });

        // Màu sắc
        var colorProfit = am5.color(0xff6600); // Cam (Yadea)
        var colorLoss = am5.color(0x666666);   // Xám đen
        var colorNoData = am5.color(0xe5e7eb); // Trắng xám

        // Logic tô màu từng tỉnh
        polygonSeries.mapPolygons.template.adapters.add("fill", function(fill, target) {
            if (!target.dataItem || !target.dataItem.dataContext) return fill;
            
            var mapNameOriginal = target.dataItem.dataContext.name; 
            var mapNameNorm = removeVietnameseTones(mapNameOriginal).toLowerCase().trim();
            
            // Tìm tên Tỉnh Mới tương ứng trong Mapping
            var mergedName = mapNameNorm; 
            for (const [oldName, newName] of Object.entries(provinceMapping)) {
                if (mapNameNorm.includes(oldName) || oldName.includes(mapNameNorm)) {
                    mergedName = newName;
                    break;
                }
            }

            // Lấy dữ liệu lợi nhuận
            var profit = provinceProfitMap[mergedName];

            if (profit !== undefined && profit !== null) {
                target.set("tooltipText", mapNameOriginal + "\n(Thuộc " + mergedName.toUpperCase() + ")\nLợi nhuận: " + fmn(profit)); 
                return profit >= 0 ? colorProfit : colorLoss;
            }
            
            return colorNoData;
        });

        // Hiệu ứng Hover
        polygonSeries.mapPolygons.template.states.create("hover", { fill: am5.color(0xffcc99) });

        // Đường lưới kinh vĩ độ (Graticule)
        var graticuleSeries = chart.series.push(am5map.GraticuleSeries.new(mapRoot, {}));
        graticuleSeries.mapLines.template.setAll({ stroke: am5.color(0xffffff), strokeOpacity: 0.05 });

        // Hiệu ứng xoay tự động
        chart.animate({ key: "rotationX", from: 0, to: 360, duration: 60000, loops: Infinity });
    });
}