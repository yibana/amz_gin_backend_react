import React from "react";
import {
  CAccordion,
  CAccordionBody, CAccordionHeader, CAccordionItem,
  CAvatar, CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol, CFormTextarea, CProgress,
  CRow, CSpinner, CTable,
  CTableBody, CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {cilCloudDownload, cilMediaPlay, cilPeople, cilMediaStop, cilMediaPause, cilHistory} from "@coreui/icons";
import "src/css/ProductDetail.css";
import {ProductDetailStart, ProductDetailStatus, ProductDetailStop} from "../../../api";

const ProductDetail = () => {
  const [proxylist, setProxylist] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  // state
  const [data, setData] = React.useState({
    "runing_path": "Best Sellers > Pet Supplies > Dogs > Memorials & Funerary",
    "paths_count": 131,
    "status": 2,
    "last_err": "",
    "thread_infos": [
      {
        "proxy": "",
        "succ": 480,
        "fail": 142,
        "info": "正在处理asin:B0BBB64L36",
        "last_err": "Service Unavailable"
      },
      {
        "proxy": "socks5://a7h9gaev:9acB8F85@45.129.1.163:64441",
        "succ": 409,
        "fail": 98,
        "info": "正在处理asin:B08BMJNQWC",
        "last_err": "robot"
      },
      {
        "proxy": "socks5://a7h9gaev:9acB8F85@103.163.52.45:63345",
        "succ": 404,
        "fail": 56,
        "info": "正在处理asin:B09BFP9HKY",
        "last_err": "Service Unavailable"
      },
      {
        "proxy": "socks5://a7h9gaev:9acB8F85@178.130.48.49:62519",
        "succ": 404,
        "fail": 96,
        "info": "正在处理asin:B09HC492QK",
        "last_err": "robot"
      },
      {
        "proxy": "socks5://a7h9gaev:9acB8F85@77.90.175.114:62613",
        "succ": 412,
        "fail": 85,
        "info": "正在处理asin:B07ZPTVTCV",
        "last_err": "robot"
      },
      {
        "proxy": "socks5://a7h9gaev:9acB8F85@77.90.186.5:62981",
        "succ": 398,
        "fail": 87,
        "info": "正在处理asin:B09HV8BJQQ",
        "last_err": "robot"
      }
    ],
    "succ_count": 2507,
    "fail_count": 564,
  });

  const onclick = () => {
    console.log("onclick", data.status);
    switch (data.status) {
      case 0:
        setLoading(true)
        // 对proxylist进行检查,必须为[]数组
        let proxys = [];
        if (proxylist.length > 0) {
          try {
            proxys = JSON.parse(proxylist);
            if (!Array.isArray(proxys)) {
              alert("代理列表格式错误")
              setLoading(false)
              return
              return;
            }
          } catch (e) {
            alert("代理列表格式错误")
            return
          }
        }
        // 保存到localStorage
        localStorage.setItem("proxylist", JSON.stringify(proxys));

        ProductDetailStart(proxys).then((res) => {
          if (res.status === "ok") {
            setData(res.result);
          }
          setLoading(false)
        })
        break;
      case 1:
        setLoading(true)
        ProductDetailStop().then((res) => {
          if (res.status === "ok") {
            setData(res.result);
          }
          setLoading(false)
        })
    }
  }

  const onRefresh = () => {
    ProductDetailStatus().then((res) => {
      if (res.status === "ok") {
        setData(res.result);
      }
    })
  }

  React.useEffect(() => {
    var proxylist = localStorage.getItem("proxylist");
    if (proxylist) {
      setProxylist(proxylist);
    }
    onRefresh();
    const intervalId = setInterval(onRefresh, 5000);
    return () => {
      clearInterval(intervalId);
    };
  }, []);


  return (
    <>
      <CRow>
        <CCol xs>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>采集任务控制台</strong>
              {
                data.runing_path.length > 0 && (<small> {data.runing_path}</small>)
              }
              {
                data.last_err.length > 0 && (<small className="text-danger"> ({data.last_err})</small>)
              }
              <CRow className="float-end">

                {
                  loading ?
                    <CCol>
                      <CSpinner component="span" size="sm" aria-hidden="true"/>
                    </CCol> :
                    <CCol>
                      <div className={data.status == 2 ? "" : "icon-hover"}>

                        <CIcon
                          className={data.status == 0 ? "text-success" : data.status == 1 ? "text-danger" : "text-warning"}
                          icon={data.status == 0 ? cilMediaPlay : data.status == 1 ? cilMediaStop : cilHistory}
                          onClick={onclick}/>
                      </div>
                    </CCol>
                }


              </CRow>

            </CCardHeader>
            <CCardBody>
              <CRow>
                <CCol>
                  <div className="border-start border-start-4 border-start-info py-1 px-3">
                    <div className="text-medium-emphasis small">剩余分类</div>
                    <div className="fs-5 fw-semibold">{data.paths_count}</div>
                  </div>
                </CCol>
                <CCol>
                  <div className="border-start border-start-4 border-start-danger py-1 px-3 mb-3">
                    <div className="text-medium-emphasis small">线程数</div>
                    <div className="fs-5 fw-semibold">{data.thread_infos?.length}</div>
                  </div>
                </CCol>
                <CCol>
                  <div className="border-start border-start-4 border-start-success py-1 px-3">
                    <div className="text-medium-emphasis small">采集成功总数</div>
                    <div className="fs-5 fw-semibold">{data.succ_count}</div>
                  </div>
                </CCol>
                <CCol>
                  <div className="border-start border-start-4 border-start-warning py-1 px-3 mb-3">
                    <div className="text-medium-emphasis small">采集失败总数</div>
                    <div className="fs-5 fw-semibold">{data.fail_count}</div>
                  </div>
                </CCol>
              </CRow>
              <hr className="mt-0"/>
              {
                data.status == 0 && (
                  <CRow className="pb-3">
                    <CAccordion activeItemKey={1}>
                      <CAccordionItem itemKey={1}>
                        <CAccordionHeader>启动参数</CAccordionHeader>
                        <CAccordionBody>
                          <CFormTextarea
                            label="代理IP(每一个代理代表一个线程):"
                            placeholder="[]"
                            rows={10}
                            value={proxylist}
                            onChange={(e) => {
                              setProxylist(e.target.value)
                            }}
                          ></CFormTextarea>
                        </CAccordionBody>
                      </CAccordionItem>

                    </CAccordion>
                  </CRow>
                )
              }
              <CTable align="middle" className="mb-0 border" hover responsive>
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>线程信息</CTableHeaderCell>
                    <CTableHeaderCell>统计(成功/失败)</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {data.thread_infos?.map((item, index) => (
                    <CTableRow v-for="item in tableItems" key={index}>
                      <CTableDataCell>
                        <div>{item.proxy || "<本地IP>"}</div>
                        <div className="small text-medium-emphasis">
                          <span>{item.info}</span> <small className="text-warning">{item.last_err}</small>
                        </div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="clearfix">
                          <div className="float-start">
                            <strong>{item.succ}</strong>
                          </div>
                          <div className="float-end">
                            <small className="text-medium-emphasis">{item.fail}</small>
                          </div>
                        </div>
                        <CProgress animated color="success"
                                   value={Math.round(item.succ / (item.succ + item.fail) * 100)}/>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  );
}

export default ProductDetail;
