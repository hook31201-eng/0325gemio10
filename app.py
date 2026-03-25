import streamlit as st
import pymssql
import pandas as pd

st.set_page_config(page_title="TriSys", page_icon="📊", layout="centered")

st.markdown("""
<style>
div.stButton > button { height: 60px; font-size: 16px; font-weight: bold; }
</style>
""", unsafe_allow_html=True)

# ── 資料庫連線 ────────────────────────────────────────────
def get_conn():
    d = st.secrets["db"]
    return pymssql.connect(
        server=d["server"], port=int(d["port"]),
        database=d["database"], user=d["user"], password=d["password"]
    )

def qry(sql, params=()):
    conn = get_conn()
    cur = conn.cursor(as_dict=True)
    cur.execute(sql, params)
    rows = cur.fetchall()
    conn.close()
    return rows

def exe(sql, params=()):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(sql, params)
    conn.commit()
    conn.close()

# ── Session 初始化 ────────────────────────────────────────
for k, v in {"page": "login", "user": None, "mode": "list",
             "edit_data": {}, "del_code": None}.items():
    if k not in st.session_state:
        st.session_state[k] = v

ss = st.session_state

def go(page, mode="list"):
    ss.page = page
    ss.mode = mode
    ss.edit_data = {}
    ss.del_code = None
    st.rerun()

# ── 登入畫面 ──────────────────────────────────────────────
if ss.page == "login":
    st.markdown("<h1 style='text-align:center'>📊 TriSys</h1>", unsafe_allow_html=True)
    st.markdown("<p style='text-align:center;color:gray'>三層式資料維護系統</p>", unsafe_allow_html=True)
    st.markdown("---")
    with st.form("login_form"):
        uid = st.text_input("用戶代碼")
        pwd = st.text_input("用戶密碼", type="password")
        if st.form_submit_button("登 入", use_container_width=True):
            try:
                rows = qry("SELECT userid, username FROM users WHERE userid=%s AND pwd=%s", (uid, pwd))
                if rows:
                    ss.user = rows[0]
                    go("main")
                else:
                    st.error("帳號或密碼錯誤")
            except Exception as e:
                st.error(f"連線失敗：{e}")

# ── 主畫面 ────────────────────────────────────────────────
elif ss.page == "main":
    st.markdown(f"<h2 style='text-align:center'>歡迎，{ss.user['username']}</h2>", unsafe_allow_html=True)
    st.markdown("---")
    c1, c2 = st.columns(2)
    if c1.button("👥\n客戶資料維護", use_container_width=True): go("cust")
    if c2.button("🏭\n廠商資料維護", use_container_width=True): go("fact")
    c3, c4 = st.columns(2)
    if c3.button("📦\n商品資料維護", use_container_width=True): go("item")
    if c4.button("👤\n用戶資料維護", use_container_width=True): go("user")
    st.markdown("---")
    if st.button("登出", use_container_width=True):
        ss.user = None
        go("login")

# ── 客戶資料維護 ──────────────────────────────────────────
elif ss.page == "cust":
    st.markdown("### 👥 客戶資料維護")
    if st.button("← 返回主畫面"): go("main")
    st.markdown("---")

    if ss.mode in ("add", "edit"):
        d = ss.edit_data
        st.markdown("**新增客戶**" if ss.mode == "add" else "**修改客戶**")
        with st.form("cust_form"):
            code  = st.text_input("客戶代碼", value=d.get("cust_code", ""), disabled=(ss.mode == "edit"))
            name  = st.text_input("客戶名稱", value=d.get("cust_name", ""))
            remark = st.text_input("備註說明", value=d.get("remark", "") or "")
            c1, c2 = st.columns(2)
            save   = c1.form_submit_button("儲存", use_container_width=True)
            cancel = c2.form_submit_button("取消", use_container_width=True)
        if save:
            try:
                if ss.mode == "add":
                    exe("INSERT INTO cust (cust_code,cust_name,remark) VALUES (%s,%s,%s)", (code, name, remark))
                    st.success("新增成功")
                else:
                    exe("UPDATE cust SET cust_name=%s, remark=%s WHERE cust_code=%s", (name, remark, d["cust_code"]))
                    st.success("修改成功")
                go("cust")
            except Exception as e:
                st.error(f"錯誤：{e}")
        if cancel: go("cust")
    else:
        rows = qry("SELECT * FROM cust ORDER BY cust_code")
        search = st.text_input("🔍 搜尋客戶代碼或名稱")
        df = pd.DataFrame(rows) if rows else pd.DataFrame(columns=["cust_code","cust_name","remark"])
        df.columns = ["客戶代碼", "客戶名稱", "備註說明"] if not df.empty else df.columns
        if search and not df.empty:
            df = df[df.apply(lambda r: search in str(r.iloc[0]) or search in str(r.iloc[1]), axis=1)]
        st.dataframe(df, use_container_width=True, hide_index=True)
        st.markdown("---")
        if st.button("➕ 新增客戶", use_container_width=True):
            ss.mode = "add"; st.rerun()
        sel = st.text_input("輸入客戶代碼（修改 / 刪除用）", key="cust_sel")
        c1, c2 = st.columns(2)
        if c1.button("✏️ 修改", use_container_width=True):
            if sel:
                r = qry("SELECT * FROM cust WHERE cust_code=%s", (sel,))
                if r: ss.edit_data = r[0]; ss.mode = "edit"; st.rerun()
                else: st.error("找不到此代碼")
        if c2.button("🗑️ 刪除", use_container_width=True):
            if sel: ss.del_code = sel; st.rerun()
        if ss.del_code:
            st.warning(f"確定要刪除 **{ss.del_code}**？")
            cc1, cc2 = st.columns(2)
            if cc1.button("✅ 確定刪除", use_container_width=True):
                exe("DELETE FROM cust WHERE cust_code=%s", (ss.del_code,))
                st.success("已刪除"); go("cust")
            if cc2.button("❌ 取消", use_container_width=True):
                ss.del_code = None; st.rerun()

# ── 廠商資料維護 ──────────────────────────────────────────
elif ss.page == "fact":
    st.markdown("### 🏭 廠商資料維護")
    if st.button("← 返回主畫面"): go("main")
    st.markdown("---")

    if ss.mode in ("add", "edit"):
        d = ss.edit_data
        st.markdown("**新增廠商**" if ss.mode == "add" else "**修改廠商**")
        with st.form("fact_form"):
            code  = st.text_input("廠商代碼", value=d.get("fact_code", ""), disabled=(ss.mode == "edit"))
            name  = st.text_input("廠商名稱", value=d.get("fact_name", ""))
            remark = st.text_input("備註說明", value=d.get("remark", "") or "")
            c1, c2 = st.columns(2)
            save   = c1.form_submit_button("儲存", use_container_width=True)
            cancel = c2.form_submit_button("取消", use_container_width=True)
        if save:
            try:
                if ss.mode == "add":
                    exe("INSERT INTO fact (fact_code,fact_name,remark) VALUES (%s,%s,%s)", (code, name, remark))
                    st.success("新增成功")
                else:
                    exe("UPDATE fact SET fact_name=%s, remark=%s WHERE fact_code=%s", (name, remark, d["fact_code"]))
                    st.success("修改成功")
                go("fact")
            except Exception as e:
                st.error(f"錯誤：{e}")
        if cancel: go("fact")
    else:
        rows = qry("SELECT * FROM fact ORDER BY fact_code")
        search = st.text_input("🔍 搜尋廠商代碼或名稱")
        df = pd.DataFrame(rows) if rows else pd.DataFrame(columns=["fact_code","fact_name","remark"])
        df.columns = ["廠商代碼", "廠商名稱", "備註說明"] if not df.empty else df.columns
        if search and not df.empty:
            df = df[df.apply(lambda r: search in str(r.iloc[0]) or search in str(r.iloc[1]), axis=1)]
        st.dataframe(df, use_container_width=True, hide_index=True)
        st.markdown("---")
        if st.button("➕ 新增廠商", use_container_width=True):
            ss.mode = "add"; st.rerun()
        sel = st.text_input("輸入廠商代碼（修改 / 刪除用）", key="fact_sel")
        c1, c2 = st.columns(2)
        if c1.button("✏️ 修改", use_container_width=True):
            if sel:
                r = qry("SELECT * FROM fact WHERE fact_code=%s", (sel,))
                if r: ss.edit_data = r[0]; ss.mode = "edit"; st.rerun()
                else: st.error("找不到此代碼")
        if c2.button("🗑️ 刪除", use_container_width=True):
            if sel: ss.del_code = sel; st.rerun()
        if ss.del_code:
            st.warning(f"確定要刪除 **{ss.del_code}**？")
            cc1, cc2 = st.columns(2)
            if cc1.button("✅ 確定刪除", use_container_width=True):
                exe("DELETE FROM fact WHERE fact_code=%s", (ss.del_code,))
                st.success("已刪除"); go("fact")
            if cc2.button("❌ 取消", use_container_width=True):
                ss.del_code = None; st.rerun()

# ── 商品資料維護 ──────────────────────────────────────────
elif ss.page == "item":
    st.markdown("### 📦 商品資料維護")
    if st.button("← 返回主畫面"): go("main")
    st.markdown("---")

    facts = qry("SELECT fact_code, fact_name FROM fact ORDER BY fact_code")
    fact_options = {f"{r['fact_code']} - {r['fact_name']}": r['fact_code'] for r in facts}
    fact_labels  = list(fact_options.keys())

    if ss.mode in ("add", "edit"):
        d = ss.edit_data
        st.markdown("**新增商品**" if ss.mode == "add" else "**修改商品**")
        cur_fact = d.get("fact_code", "")
        cur_label = next((l for l, v in fact_options.items() if v == cur_fact), fact_labels[0] if fact_labels else "")
        with st.form("item_form"):
            code  = st.text_input("商品代碼", value=d.get("item_code", ""), disabled=(ss.mode == "edit"))
            name  = st.text_input("商品名稱", value=d.get("item_name", ""))
            idx   = fact_labels.index(cur_label) if cur_label in fact_labels else 0
            sel_fact = st.selectbox("主供應商", fact_labels, index=idx)
            c1, c2 = st.columns(2)
            save   = c1.form_submit_button("儲存", use_container_width=True)
            cancel = c2.form_submit_button("取消", use_container_width=True)
        if save:
            try:
                fcode = fact_options.get(sel_fact, "")
                if ss.mode == "add":
                    exe("INSERT INTO item (item_code,item_name,fact_code) VALUES (%s,%s,%s)", (code, name, fcode))
                    st.success("新增成功")
                else:
                    exe("UPDATE item SET item_name=%s, fact_code=%s WHERE item_code=%s", (name, fcode, d["item_code"]))
                    st.success("修改成功")
                go("item")
            except Exception as e:
                st.error(f"錯誤：{e}")
        if cancel: go("item")
    else:
        rows = qry("SELECT i.item_code, i.item_name, i.fact_code, f.fact_name FROM item i LEFT JOIN fact f ON i.fact_code=f.fact_code ORDER BY i.item_code")
        search = st.text_input("🔍 搜尋商品代碼或名稱")
        df = pd.DataFrame(rows) if rows else pd.DataFrame(columns=["item_code","item_name","fact_code","fact_name"])
        if not df.empty:
            df.columns = ["商品代碼", "商品名稱", "廠商代碼", "廠商名稱"]
        if search and not df.empty:
            df = df[df.apply(lambda r: search in str(r.iloc[0]) or search in str(r.iloc[1]), axis=1)]
        st.dataframe(df, use_container_width=True, hide_index=True)
        st.markdown("---")
        if st.button("➕ 新增商品", use_container_width=True):
            ss.mode = "add"; st.rerun()
        sel = st.text_input("輸入商品代碼（修改 / 刪除用）", key="item_sel")
        c1, c2 = st.columns(2)
        if c1.button("✏️ 修改", use_container_width=True):
            if sel:
                r = qry("SELECT * FROM item WHERE item_code=%s", (sel,))
                if r: ss.edit_data = r[0]; ss.mode = "edit"; st.rerun()
                else: st.error("找不到此代碼")
        if c2.button("🗑️ 刪除", use_container_width=True):
            if sel: ss.del_code = sel; st.rerun()
        if ss.del_code:
            st.warning(f"確定要刪除 **{ss.del_code}**？")
            cc1, cc2 = st.columns(2)
            if cc1.button("✅ 確定刪除", use_container_width=True):
                exe("DELETE FROM item WHERE item_code=%s", (ss.del_code,))
                st.success("已刪除"); go("item")
            if cc2.button("❌ 取消", use_container_width=True):
                ss.del_code = None; st.rerun()

# ── 用戶資料維護 ──────────────────────────────────────────
elif ss.page == "user":
    st.markdown("### 👤 用戶資料維護")
    if st.button("← 返回主畫面"): go("main")
    st.markdown("---")

    if ss.mode in ("add", "edit"):
        d = ss.edit_data
        st.markdown("**新增用戶**" if ss.mode == "add" else "**修改用戶**")
        with st.form("user_form"):
            uid   = st.text_input("用戶代碼", value=d.get("userid", ""), disabled=(ss.mode == "edit"))
            uname = st.text_input("用戶名稱", value=d.get("username", ""))
            upwd  = st.text_input("用戶密碼", value=d.get("pwd", ""))
            c1, c2 = st.columns(2)
            save   = c1.form_submit_button("儲存", use_container_width=True)
            cancel = c2.form_submit_button("取消", use_container_width=True)
        if save:
            try:
                if ss.mode == "add":
                    exe("INSERT INTO users (userid,username,pwd) VALUES (%s,%s,%s)", (uid, uname, upwd))
                    st.success("新增成功")
                else:
                    exe("UPDATE users SET username=%s, pwd=%s WHERE userid=%s", (uname, upwd, d["userid"]))
                    st.success("修改成功")
                go("user")
            except Exception as e:
                st.error(f"錯誤：{e}")
        if cancel: go("user")
    else:
        rows = qry("SELECT * FROM users ORDER BY userid")
        search = st.text_input("🔍 搜尋用戶代碼或名稱")
        df = pd.DataFrame(rows) if rows else pd.DataFrame(columns=["userid","username","pwd"])
        df.columns = ["用戶代碼", "用戶名稱", "用戶密碼"] if not df.empty else df.columns
        if search and not df.empty:
            df = df[df.apply(lambda r: search in str(r.iloc[0]) or search in str(r.iloc[1]), axis=1)]
        st.dataframe(df, use_container_width=True, hide_index=True)
        st.markdown("---")
        if st.button("➕ 新增用戶", use_container_width=True):
            ss.mode = "add"; st.rerun()
        sel = st.text_input("輸入用戶代碼（修改 / 刪除用）", key="user_sel")
        c1, c2 = st.columns(2)
        if c1.button("✏️ 修改", use_container_width=True):
            if sel:
                r = qry("SELECT * FROM users WHERE userid=%s", (sel,))
                if r: ss.edit_data = r[0]; ss.mode = "edit"; st.rerun()
                else: st.error("找不到此代碼")
        if c2.button("🗑️ 刪除", use_container_width=True):
            if sel: ss.del_code = sel; st.rerun()
        if ss.del_code:
            st.warning(f"確定要刪除 **{ss.del_code}**？")
            cc1, cc2 = st.columns(2)
            if cc1.button("✅ 確定刪除", use_container_width=True):
                exe("DELETE FROM users WHERE userid=%s", (ss.del_code,))
                st.success("已刪除"); go("user")
            if cc2.button("❌ 取消", use_container_width=True):
                ss.del_code = None; st.rerun()
