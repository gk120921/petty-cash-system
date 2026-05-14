# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.js >> Petty Cash - Core Smoke Test v1.1 >> Continuous Critical Path: Login -> Toggle -> Database Verify -> Persistence
- Location: tests\smoke.spec.js:7:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h2, h3').filter({ hasText: /Ledger/i }).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h2, h3').filter({ hasText: /Ledger/i }).first()

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e6]:
      - generic [ref=e7]:
        - img [ref=e9]
        - generic [ref=e12]:
          - heading "PettyCash" [level=1] [ref=e13]
          - paragraph [ref=e14]: OPTIMIZATION LAB
      - navigation [ref=e15]:
        - paragraph [ref=e16]: Main Menu
        - button "儀表板 Dashboard" [ref=e17]:
          - img [ref=e19]
          - generic [ref=e24]: 儀表板 Dashboard
        - button "收支帳 Ledger" [active] [ref=e25]:
          - img [ref=e27]
          - generic [ref=e28]: 收支帳 Ledger
        - button "供應商 Suppliers" [ref=e29]:
          - img [ref=e31]
          - generic [ref=e36]: 供應商 Suppliers
        - button "歸檔紀錄 Archive" [ref=e37]:
          - img [ref=e39]
          - generic [ref=e42]: 歸檔紀錄 Archive
        - button "人員權限 Access" [ref=e43]:
          - img [ref=e45]
          - generic [ref=e47]: 人員權限 Access
        - button "系統設定 Settings" [ref=e48]:
          - img [ref=e50]
          - generic [ref=e53]: 系統設定 Settings
      - button "Logout" [ref=e55]:
        - img [ref=e56]
        - text: Logout
  - main [ref=e59]:
    - generic [ref=e60]:
      - heading "System Active • India Warehouse" [level=2] [ref=e63]
      - generic [ref=e64]:
        - generic [ref=e65]:
          - generic [ref=e66]: Global Balance
          - generic [ref=e67]: $-56,945
        - generic [ref=e68]:
          - button "公司撥款 TOP-UP" [ref=e69]:
            - img [ref=e70]
            - text: 公司撥款 TOP-UP
          - button "個人代墊 ADVANCE" [ref=e72]:
            - img [ref=e73]
            - text: 個人代墊 ADVANCE
          - button "新增紀錄 NEW ENTRY" [ref=e75]:
            - img [ref=e76]
            - text: 新增紀錄 NEW ENTRY
    - generic [ref=e80]:
      - generic [ref=e81]:
        - generic [ref=e82]:
          - img [ref=e84]
          - generic [ref=e87]:
            - generic [ref=e88]:
              - heading "Initial Capital" [level=4] [ref=e89]
              - generic [ref=e90]:
                - generic [ref=e91]: "期初餘額:"
                - spinbutton [ref=e92]: "208067"
            - generic [ref=e94]:
              - heading "Alert System" [level=4] [ref=e95]
              - generic [ref=e96]:
                - generic [ref=e97]: "警示水位 Threshold:"
                - spinbutton [ref=e98]: "15000"
        - generic [ref=e99]:
          - button [ref=e100]:
            - img [ref=e101]
          - button "切換英文 (Switch to EN)" [ref=e103]:
            - img [ref=e104]
            - text: 切換英文 (Switch to EN)
          - button "匯出 EXCEL" [ref=e107]:
            - img [ref=e108]
            - text: 匯出 EXCEL
      - generic [ref=e111]:
        - generic [ref=e112]:
          - button "全部 ALL" [ref=e113]
          - button "2026年 5月" [ref=e114]
          - button "2026年 4月" [ref=e115]
        - generic [ref=e116]:
          - generic [ref=e117]:
            - button "篩選器 FILTERS" [ref=e118]:
              - img [ref=e119]
              - text: 篩選器 FILTERS
            - button [ref=e122]:
              - img [ref=e123]
          - generic [ref=e126]:
            - generic [ref=e127]:
              - img [ref=e128]
              - textbox "搜尋 Search..." [ref=e131]
            - button [ref=e132]:
              - img [ref=e133]
        - table [ref=e138]:
          - rowgroup [ref=e139]:
            - row "序號 SN 發票日期 INV. DATE 報帳日期 REIMB. DATE 供應商 SUPPLIER 細目 (中) DETAIL (ZH) 類別 CATEGORY 收入 IN 支出 OUT Balance Personnel Status Bill Photo Actions" [ref=e140]:
              - columnheader [ref=e141]:
                - checkbox [ref=e142]
              - columnheader "序號 SN" [ref=e143] [cursor=pointer]:
                - generic [ref=e144]:
                  - text: 序號 SN
                  - img [ref=e146]
              - columnheader "發票日期 INV. DATE" [ref=e149] [cursor=pointer]:
                - generic [ref=e150]:
                  - text: 發票日期 INV. DATE
                  - img [ref=e151]
              - columnheader "報帳日期 REIMB. DATE" [ref=e154] [cursor=pointer]:
                - generic [ref=e155]:
                  - text: 報帳日期 REIMB. DATE
                  - img [ref=e156]
              - columnheader "供應商 SUPPLIER" [ref=e159] [cursor=pointer]:
                - generic [ref=e160]:
                  - text: 供應商 SUPPLIER
                  - img [ref=e161]
              - columnheader "細目 (中) DETAIL (ZH)" [ref=e164]
              - columnheader "類別 CATEGORY" [ref=e165] [cursor=pointer]:
                - generic [ref=e166]:
                  - text: 類別 CATEGORY
                  - img [ref=e167]
              - columnheader "收入 IN" [ref=e170] [cursor=pointer]:
                - generic [ref=e171]:
                  - text: 收入 IN
                  - img [ref=e172]
              - columnheader "支出 OUT" [ref=e175] [cursor=pointer]:
                - generic [ref=e176]:
                  - text: 支出 OUT
                  - img [ref=e177]
              - columnheader "Balance" [ref=e180]
              - columnheader "Personnel" [ref=e181] [cursor=pointer]:
                - generic [ref=e182]:
                  - text: Personnel
                  - img [ref=e183]
              - columnheader "Status" [ref=e186] [cursor=pointer]:
                - generic [ref=e187]:
                  - text: Status
                  - img [ref=e188]
              - columnheader "Bill" [ref=e191]
              - columnheader "Photo" [ref=e192]
              - columnheader "Actions" [ref=e193]
          - rowgroup [ref=e194]:
            - row "Opening Balance (期初餘額) $208,067" [ref=e195]:
              - cell [ref=e196]
              - cell "Opening Balance (期初餘額)" [ref=e197]
              - cell "$208,067" [ref=e198]
              - cell [ref=e199]
            - row "#26 2026-04-26 2026-04-27 D-Mart 宿舍及工廠飲料、零食 製造-什費 $0 $2,446 $205,621 YI CHANG 待付款 雙擊查看大圖 Double click to view" [ref=e200]:
              - cell [ref=e201]:
                - checkbox [ref=e202] [cursor=pointer]
              - cell "#26" [ref=e203]
              - cell "2026-04-26" [ref=e204]
              - cell "2026-04-27" [ref=e205]
              - cell "D-Mart" [ref=e206]
              - cell "宿舍及工廠飲料、零食" [ref=e207]
              - cell "製造-什費" [ref=e208]
              - cell "$0" [ref=e209]
              - cell "$2,446" [ref=e210]
              - cell "$205,621" [ref=e211]
              - cell "YI CHANG" [ref=e212]
              - cell "待付款" [ref=e213]:
                - button "待付款" [ref=e214]:
                  - img [ref=e215]
                  - text: 待付款
              - cell [ref=e218]:
                - img [ref=e219]
              - cell "雙擊查看大圖 Double click to view" [ref=e222]:
                - img "雙擊查看大圖 Double click to view" [ref=e223] [cursor=pointer]
              - cell [ref=e226]:
                - generic [ref=e227]:
                  - button [ref=e228]:
                    - img [ref=e229]
                  - button [ref=e231]:
                    - img [ref=e232]
            - row "#28 2026-04-26 2026-04-27 NAMMR FRUITS AND NUTS yichang 宿舍食材 製造-伙食費 $0 $390 $205,231 YI CHANG 待付款 -" [ref=e235]:
              - cell [ref=e236]:
                - checkbox [ref=e237] [cursor=pointer]
              - cell "#28" [ref=e238]
              - cell "2026-04-26" [ref=e239]
              - cell "2026-04-27" [ref=e240]
              - cell "NAMMR FRUITS AND NUTS" [ref=e241]
              - cell "yichang 宿舍食材" [ref=e242]
              - cell "製造-伙食費" [ref=e243]
              - cell "$0" [ref=e244]
              - cell "$390" [ref=e245]
              - cell "$205,231" [ref=e246]
              - cell "YI CHANG" [ref=e247]
              - cell "待付款" [ref=e248]:
                - button "待付款" [ref=e249]:
                  - img [ref=e250]
                  - text: 待付款
              - cell [ref=e253]:
                - img [ref=e254]
              - cell "-" [ref=e257]
              - cell [ref=e258]:
                - generic [ref=e259]:
                  - button [ref=e260]:
                    - img [ref=e261]
                  - button [ref=e263]:
                    - img [ref=e264]
            - row "#29 2026-04-26 2026-04-26 NAMMR FRUITS AND NUTS yichang 宿舍食材 製造-伙食費 $0 $390 $204,841 YI CHANG 待付款 -" [ref=e267]:
              - cell [ref=e268]:
                - checkbox [ref=e269] [cursor=pointer]
              - cell "#29" [ref=e270]
              - cell "2026-04-26" [ref=e271]
              - cell "2026-04-26" [ref=e272]
              - cell "NAMMR FRUITS AND NUTS" [ref=e273]
              - cell "yichang 宿舍食材" [ref=e274]
              - cell "製造-伙食費" [ref=e275]
              - cell "$0" [ref=e276]
              - cell "$390" [ref=e277]
              - cell "$204,841" [ref=e278]
              - cell "YI CHANG" [ref=e279]
              - cell "待付款" [ref=e280]:
                - button "待付款" [ref=e281]:
                  - img [ref=e282]
                  - text: 待付款
              - cell [ref=e285]:
                - img [ref=e286]
              - cell "-" [ref=e289]
              - cell [ref=e290]:
                - generic [ref=e291]:
                  - button [ref=e292]:
                    - img [ref=e293]
                  - button [ref=e295]:
                    - img [ref=e296]
            - row "#30 2026-04-29 2026-04-29 SEOUL STORE yichang 宿舍食材 製造-伙食費 $0 $1,050 $203,791 YI CHANG 待付款 雙擊查看大圖 Double click to view" [ref=e299]:
              - cell [ref=e300]:
                - checkbox [ref=e301] [cursor=pointer]
              - cell "#30" [ref=e302]
              - cell "2026-04-29" [ref=e303]
              - cell "2026-04-29" [ref=e304]
              - cell "SEOUL STORE" [ref=e305]
              - cell "yichang 宿舍食材" [ref=e306]
              - cell "製造-伙食費" [ref=e307]
              - cell "$0" [ref=e308]
              - cell "$1,050" [ref=e309]
              - cell "$203,791" [ref=e310]
              - cell "YI CHANG" [ref=e311]
              - cell "待付款" [ref=e312]:
                - button "待付款" [ref=e313]:
                  - img [ref=e314]
                  - text: 待付款
              - cell [ref=e317]:
                - img [ref=e318]
              - cell "雙擊查看大圖 Double click to view" [ref=e321]:
                - img "雙擊查看大圖 Double click to view" [ref=e322] [cursor=pointer]
              - cell [ref=e325]:
                - generic [ref=e326]:
                  - button [ref=e327]:
                    - img [ref=e328]
                  - button [ref=e330]:
                    - img [ref=e331]
            - row "#33 2026-04-29 2026-04-30 auto(運費) 電子磅秤運費 製造-運費(下貨櫃、貨運、堆高機、叉車..等費用) $0 $700 $203,091 YI CHANG 待付款 - -" [ref=e334]:
              - cell [ref=e335]:
                - checkbox [ref=e336] [cursor=pointer]
              - cell "#33" [ref=e337]
              - cell "2026-04-29" [ref=e338]
              - cell "2026-04-30" [ref=e339]
              - cell "auto(運費)" [ref=e340]
              - cell "電子磅秤運費" [ref=e341]
              - cell "製造-運費(下貨櫃、貨運、堆高機、叉車..等費用)" [ref=e342]
              - cell "$0" [ref=e343]
              - cell "$700" [ref=e344]
              - cell "$203,091" [ref=e345]
              - cell "YI CHANG" [ref=e346]
              - cell "待付款" [ref=e347]:
                - button "待付款" [ref=e348]:
                  - img [ref=e349]
                  - text: 待付款
              - cell "-" [ref=e352]
              - cell "-" [ref=e353]
              - cell [ref=e354]:
                - generic [ref=e355]:
                  - button [ref=e356]:
                    - img [ref=e357]
                  - button [ref=e359]:
                    - img [ref=e360]
            - row "#46 2026-04-29 2026-04-30 SEOUL STORE yichang 宿舍食材 製造-伙食費 $0 $420 $202,671 YI CHANG 待付款 雙擊查看大圖 Double click to view" [ref=e363]:
              - cell [ref=e364]:
                - checkbox [ref=e365] [cursor=pointer]
              - cell "#46" [ref=e366]
              - cell "2026-04-29" [ref=e367]
              - cell "2026-04-30" [ref=e368]
              - cell "SEOUL STORE" [ref=e369]
              - cell "yichang 宿舍食材" [ref=e370]
              - cell "製造-伙食費" [ref=e371]
              - cell "$0" [ref=e372]
              - cell "$420" [ref=e373]
              - cell "$202,671" [ref=e374]
              - cell "YI CHANG" [ref=e375]
              - cell "待付款" [ref=e376]:
                - button "待付款" [ref=e377]:
                  - img [ref=e378]
                  - text: 待付款
              - cell [ref=e381]:
                - img [ref=e382]
              - cell "雙擊查看大圖 Double click to view" [ref=e385]:
                - img "雙擊查看大圖 Double click to view" [ref=e386] [cursor=pointer]
              - cell [ref=e389]:
                - generic [ref=e390]:
                  - button [ref=e391]:
                    - img [ref=e392]
                  - button [ref=e394]:
                    - img [ref=e395]
            - row "#32 2026-04-30 2026-04-30 交通費 cmr拿零件 製造-交通費 $0 $1,000 $201,671 YI CHANG 待付款 - -" [ref=e398]:
              - cell [ref=e399]:
                - checkbox [ref=e400] [cursor=pointer]
              - cell "#32" [ref=e401]
              - cell "2026-04-30" [ref=e402]
              - cell "2026-04-30" [ref=e403]
              - cell "交通費" [ref=e404]
              - cell "cmr拿零件" [ref=e405]
              - cell "製造-交通費" [ref=e406]
              - cell "$0" [ref=e407]
              - cell "$1,000" [ref=e408]
              - cell "$201,671" [ref=e409]
              - cell "YI CHANG" [ref=e410]
              - cell "待付款" [ref=e411]:
                - button "待付款" [ref=e412]:
                  - img [ref=e413]
                  - text: 待付款
              - cell "-" [ref=e416]
              - cell "-" [ref=e417]
              - cell [ref=e418]:
                - generic [ref=e419]:
                  - button [ref=e420]:
                    - img [ref=e421]
                  - button [ref=e423]:
                    - img [ref=e424]
            - row "#47 2026-04-30 2026-04-30 auto(運費) 拖板車送維修回廠運費 製造-運費(下貨櫃、貨運、堆高機、叉車..等費用) $0 $582 $201,089 YI CHANG 已付款 雙擊查看大圖 Double click to view" [ref=e427]:
              - cell [ref=e428]:
                - checkbox [ref=e429] [cursor=pointer]
              - cell "#47" [ref=e430]
              - cell "2026-04-30" [ref=e431]
              - cell "2026-04-30" [ref=e432]
              - cell "auto(運費)" [ref=e433]
              - cell "拖板車送維修回廠運費" [ref=e434]
              - cell "製造-運費(下貨櫃、貨運、堆高機、叉車..等費用)" [ref=e435]
              - cell "$0" [ref=e436]
              - cell "$582" [ref=e437]
              - cell "$201,089" [ref=e438]
              - cell "YI CHANG" [ref=e439]
              - cell "已付款" [ref=e440]:
                - button "已付款" [ref=e441]:
                  - img [ref=e442]
                  - text: 已付款
              - cell [ref=e445]:
                - img [ref=e446]
              - cell "雙擊查看大圖 Double click to view" [ref=e449]:
                - img "雙擊查看大圖 Double click to view" [ref=e450] [cursor=pointer]
              - cell [ref=e453]:
                - generic [ref=e454]:
                  - button [ref=e455]:
                    - img [ref=e456]
                  - button [ref=e458]:
                    - img [ref=e459]
            - row "#48 2026-04-30 2026-04-30 SEOUL STORE 202宿舍飲用水及食材 製造-伙食費 $0 $1,080 $200,009 YI CHANG 已付款 -" [ref=e462]:
              - cell [ref=e463]:
                - checkbox [ref=e464] [cursor=pointer]
              - cell "#48" [ref=e465]
              - cell "2026-04-30" [ref=e466]
              - cell "2026-04-30" [ref=e467]
              - cell "SEOUL STORE" [ref=e468]
              - cell "202宿舍飲用水及食材" [ref=e469]
              - cell "製造-伙食費" [ref=e470]
              - cell "$0" [ref=e471]
              - cell "$1,080" [ref=e472]
              - cell "$200,009" [ref=e473]
              - cell "YI CHANG" [ref=e474]
              - cell "已付款" [ref=e475]:
                - button "已付款" [ref=e476]:
                  - img [ref=e477]
                  - text: 已付款
              - cell [ref=e480]:
                - img [ref=e481]
              - cell "-" [ref=e484]
              - cell [ref=e485]:
                - generic [ref=e486]:
                  - button [ref=e487]:
                    - img [ref=e488]
                  - button [ref=e490]:
                    - img [ref=e491]
            - row "#49 2026-04-30 2026-04-30 交通費 派拉蒙來回公司及宿舍費用(洪處、佐霖) 製造-交通費 $0 $8,000 $192,009 YI CHANG 待付款 - -" [ref=e494]:
              - cell [ref=e495]:
                - checkbox [ref=e496] [cursor=pointer]
              - cell "#49" [ref=e497]
              - cell "2026-04-30" [ref=e498]
              - cell "2026-04-30" [ref=e499]
              - cell "交通費" [ref=e500]
              - cell "派拉蒙來回公司及宿舍費用(洪處、佐霖)" [ref=e501]
              - cell "製造-交通費" [ref=e502]
              - cell "$0" [ref=e503]
              - cell "$8,000" [ref=e504]
              - cell "$192,009" [ref=e505]
              - cell "YI CHANG" [ref=e506]
              - cell "待付款" [ref=e507]:
                - button "待付款" [ref=e508]:
                  - img [ref=e509]
                  - text: 待付款
              - cell "-" [ref=e512]
              - cell "-" [ref=e513]
              - cell [ref=e514]:
                - generic [ref=e515]:
                  - button [ref=e516]:
                    - img [ref=e517]
                  - button [ref=e519]:
                    - img [ref=e520]
            - row "#34 2026-05-01 2026-05-01 SHOPPERS STOP 鍋子、玻璃瓶、馬克杯等 製造-什費 $0 $3,661 $188,348 YI CHANG 待付款 -" [ref=e523]:
              - cell [ref=e524]:
                - checkbox [ref=e525] [cursor=pointer]
              - cell "#34" [ref=e526]
              - cell "2026-05-01" [ref=e527]
              - cell "2026-05-01" [ref=e528]
              - cell "SHOPPERS STOP" [ref=e529]
              - cell "鍋子、玻璃瓶、馬克杯等" [ref=e530]
              - cell "製造-什費" [ref=e531]
              - cell "$0" [ref=e532]
              - cell "$3,661" [ref=e533]
              - cell "$188,348" [ref=e534]
              - cell "YI CHANG" [ref=e535]
              - cell "待付款" [ref=e536]:
                - button "待付款" [ref=e537]:
                  - img [ref=e538]
                  - text: 待付款
              - cell [ref=e541]:
                - img [ref=e542]
              - cell "-" [ref=e545]
              - cell [ref=e546]:
                - generic [ref=e547]:
                  - button [ref=e548]:
                    - img [ref=e549]
                  - button [ref=e551]:
                    - img [ref=e552]
            - row "#35 2026-05-01 2026-05-01 SMART BAZAAR 電磁爐、刀具、杯子、飲料、洗衣精等 製造-什費 $0 $6,952 $181,396 YI CHANG 待付款 -" [ref=e555]:
              - cell [ref=e556]:
                - checkbox [ref=e557] [cursor=pointer]
              - cell "#35" [ref=e558]
              - cell "2026-05-01" [ref=e559]
              - cell "2026-05-01" [ref=e560]
              - cell "SMART BAZAAR" [ref=e561]
              - cell "電磁爐、刀具、杯子、飲料、洗衣精等" [ref=e562]
              - cell "製造-什費" [ref=e563]
              - cell "$0" [ref=e564]
              - cell "$6,952" [ref=e565]
              - cell "$181,396" [ref=e566]
              - cell "YI CHANG" [ref=e567]
              - cell "待付款" [ref=e568]:
                - button "待付款" [ref=e569]:
                  - img [ref=e570]
                  - text: 待付款
              - cell [ref=e573]:
                - img [ref=e574]
              - cell "-" [ref=e577]
              - cell [ref=e578]:
                - generic [ref=e579]:
                  - button [ref=e580]:
                    - img [ref=e581]
                  - button [ref=e583]:
                    - img [ref=e584]
            - row "#36 2026-05-03 2026-05-03 D-MART 802及202宿舍五金配件及零食 製造-什費 $0 $2,872 $178,524 YI CHANG 待付款 -" [ref=e587]:
              - cell [ref=e588]:
                - checkbox [ref=e589] [cursor=pointer]
              - cell "#36" [ref=e590]
              - cell "2026-05-03" [ref=e591]
              - cell "2026-05-03" [ref=e592]
              - cell "D-MART" [ref=e593]
              - cell "802及202宿舍五金配件及零食" [ref=e594]
              - cell "製造-什費" [ref=e595]
              - cell "$0" [ref=e596]
              - cell "$2,872" [ref=e597]
              - cell "$178,524" [ref=e598]
              - cell "YI CHANG" [ref=e599]
              - cell "待付款" [ref=e600]:
                - button "待付款" [ref=e601]:
                  - img [ref=e602]
                  - text: 待付款
              - cell [ref=e605]:
                - img [ref=e606]
              - cell "-" [ref=e609]
              - cell [ref=e610]:
                - generic [ref=e611]:
                  - button [ref=e612]:
                    - img [ref=e613]
                  - button [ref=e615]:
                    - img [ref=e616]
            - row "#31 2026-05-04 2026-05-04 KABIR 每月交通費 製造-交通費 $0 $12,000 $166,524 KABIR 待付款 - -" [ref=e619]:
              - cell [ref=e620]:
                - checkbox [ref=e621] [cursor=pointer]
              - cell "#31" [ref=e622]
              - cell "2026-05-04" [ref=e623]
              - cell "2026-05-04" [ref=e624]
              - cell "KABIR" [ref=e625]
              - cell "每月交通費" [ref=e626]
              - cell "製造-交通費" [ref=e627]
              - cell "$0" [ref=e628]
              - cell "$12,000" [ref=e629]
              - cell "$166,524" [ref=e630]
              - cell "KABIR" [ref=e631]
              - cell "待付款" [ref=e632]:
                - button "待付款" [ref=e633]:
                  - img [ref=e634]
                  - text: 待付款
              - cell "-" [ref=e637]
              - cell "-" [ref=e638]
              - cell [ref=e639]:
                - generic [ref=e640]:
                  - button [ref=e641]:
                    - img [ref=e642]
                  - button [ref=e644]:
                    - img [ref=e645]
            - row "#37 2026-05-04 2026-05-04 SEOUL STORE 202宿舍飲用水 製造-伙食費 $0 $108 $166,416 YI CHANG 待付款 -" [ref=e648]:
              - cell [ref=e649]:
                - checkbox [ref=e650] [cursor=pointer]
              - cell "#37" [ref=e651]
              - cell "2026-05-04" [ref=e652]
              - cell "2026-05-04" [ref=e653]
              - cell "SEOUL STORE" [ref=e654]
              - cell "202宿舍飲用水" [ref=e655]
              - cell "製造-伙食費" [ref=e656]
              - cell "$0" [ref=e657]
              - cell "$108" [ref=e658]
              - cell "$166,416" [ref=e659]
              - cell "YI CHANG" [ref=e660]
              - cell "待付款" [ref=e661]:
                - button "待付款" [ref=e662]:
                  - img [ref=e663]
                  - text: 待付款
              - cell [ref=e666]:
                - img [ref=e667]
              - cell "-" [ref=e670]
              - cell [ref=e671]:
                - generic [ref=e672]:
                  - button [ref=e673]:
                    - img [ref=e674]
                  - button [ref=e676]:
                    - img [ref=e677]
            - row "#38 2026-05-04 2026-05-04 DHL 泰國寄伺服連接板到印度關稅 製造-什費 $0 $6,994 $159,422 KABIR 待付款 -" [ref=e680]:
              - cell [ref=e681]:
                - checkbox [ref=e682] [cursor=pointer]
              - cell "#38" [ref=e683]
              - cell "2026-05-04" [ref=e684]
              - cell "2026-05-04" [ref=e685]
              - cell "DHL" [ref=e686]
              - cell "泰國寄伺服連接板到印度關稅" [ref=e687]
              - cell "製造-什費" [ref=e688]
              - cell "$0" [ref=e689]
              - cell "$6,994" [ref=e690]
              - cell "$159,422" [ref=e691]
              - cell "KABIR" [ref=e692]
              - cell "待付款" [ref=e693]:
                - button "待付款" [ref=e694]:
                  - img [ref=e695]
                  - text: 待付款
              - cell [ref=e698]:
                - img [ref=e699]
              - cell "-" [ref=e702]
              - cell [ref=e703]:
                - generic [ref=e704]:
                  - button [ref=e705]:
                    - img [ref=e706]
                  - button [ref=e708]:
                    - img [ref=e709]
            - row "#39 2026-05-04 2026-05-04 小巴士 機場接機(洪處、大餅、等5位) 製造-交通費 $0 $7,500 $151,922 KABIR 待付款 -" [ref=e712]:
              - cell [ref=e713]:
                - checkbox [ref=e714] [cursor=pointer]
              - cell "#39" [ref=e715]
              - cell "2026-05-04" [ref=e716]
              - cell "2026-05-04" [ref=e717]
              - cell "小巴士" [ref=e718]
              - cell "機場接機(洪處、大餅、等5位)" [ref=e719]
              - cell "製造-交通費" [ref=e720]
              - cell "$0" [ref=e721]
              - cell "$7,500" [ref=e722]
              - cell "$151,922" [ref=e723]
              - cell "KABIR" [ref=e724]
              - cell "待付款" [ref=e725]:
                - button "待付款" [ref=e726]:
                  - img [ref=e727]
                  - text: 待付款
              - cell [ref=e730]:
                - img [ref=e731]
              - cell "-" [ref=e734]
              - cell [ref=e735]:
                - generic [ref=e736]:
                  - button [ref=e737]:
                    - img [ref=e738]
                  - button [ref=e740]:
                    - img [ref=e741]
            - row "#42 2026-05-06 2026-05-06 CALL TAXI call taxi 製造-交通費 $0 $800 $151,122 YI CHANG 待付款 -" [ref=e744]:
              - cell [ref=e745]:
                - checkbox [ref=e746] [cursor=pointer]
              - cell "#42" [ref=e747]
              - cell "2026-05-06" [ref=e748]
              - cell "2026-05-06" [ref=e749]
              - cell "CALL TAXI" [ref=e750]
              - cell "call taxi" [ref=e751]
              - cell "製造-交通費" [ref=e752]
              - cell "$0" [ref=e753]
              - cell "$800" [ref=e754]
              - cell "$151,122" [ref=e755]
              - cell "YI CHANG" [ref=e756]
              - cell "待付款" [ref=e757]:
                - button "待付款" [ref=e758]:
                  - img [ref=e759]
                  - text: 待付款
              - cell [ref=e762]:
                - img [ref=e763]
              - cell "-" [ref=e766]
              - cell [ref=e767]:
                - generic [ref=e768]:
                  - button [ref=e769]:
                    - img [ref=e770]
                  - button [ref=e772]:
                    - img [ref=e773]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const BASE_URL = 'http://127.0.0.1:8080';
  4  | 
  5  | test.describe('Petty Cash - Core Smoke Test v1.1', () => {
  6  |   
  7  |   test('Continuous Critical Path: Login -> Toggle -> Database Verify -> Persistence', async ({ page }) => {
  8  |     // 1. Visit Login & Perform Admin Login
  9  |     await page.goto(BASE_URL);
  10 |     await page.locator('input[type="text"], input[placeholder*="ID"]').first().fill('admin');
  11 |     await page.locator('input[type="password"]').fill('admin');
  12 |     await page.locator('button', { hasText: /進入系統|SIGN IN|登入|Login/ }).click();
  13 |     await expect(page.locator('aside')).toBeVisible({ timeout: 20000 });
  14 |     console.log('✅ Login Successful');
  15 | 
  16 |     // 2. Navigate to Ledger (Target the specific sidebar item)
  17 |     await page.locator('aside >> text=/收支帳|Ledger/').first().click();
> 18 |     await expect(page.locator('h2, h3', { hasText: /Ledger/i }).first()).toBeVisible();
     |                                                                          ^ Error: expect(locator).toBeVisible() failed
  19 | 
  20 |     // 3. Trigger Language Toggle
  21 |     const langBtn = page.locator('button', { hasText: /Switch to EN/i });
  22 |     await langBtn.click();
  23 |     console.log('🔄 Switched to English mode');
  24 | 
  25 |     // 4. Verify Bilingual Integration (Headers & Content)
  26 |     await expect(page.locator('th', { hasText: /^CATEGORY$/ })).toBeVisible();
  27 |     
  28 |     // Check for specific English keywords in category column
  29 |     const tableBody = page.locator('table tbody');
  30 |     await expect(tableBody).toContainText(/Manufacturing|Personal|Advance/i, { timeout: 10000 });
  31 |     console.log('✅ Database Bilingual Content Verified');
  32 | 
  33 |     // 5. Verify Persistence (Associated with User via LocalStorage)
  34 |     await page.reload();
  35 |     await page.waitForLoadState('networkidle');
  36 |     // After reload, it should STILL be in English mode
  37 |     await expect(page.locator('th', { hasText: /^CATEGORY$/ })).toBeVisible({ timeout: 15000 });
  38 |     console.log('✅ Language Preference Persistence Verified');
  39 |   });
  40 | 
  41 | });
  42 | 
```