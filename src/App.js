import React, {
  createContext,
  useState,
  useContext,
  useEffect,
} from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Link,
  Outlet,
} from "react-router-dom";
import "./App.css";
import { Map, MapMarker, Roadview, RoadviewMarker } from "react-kakao-maps-sdk";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ResponsiveContainer,
  LineChart,
} from "recharts";

function fetchData(searchYearCd) {
  const endPoint =
    "https://apis.data.go.kr/B552061/frequentzoneOldman/getRestFrequentzoneOldman";
  const serviceKey = process.env.REACT_APP_SERVICE_KEY;
  const siDo = 28;
  const goGun = 237;
  const type = "json";
  const numOfRows = 10;
  const pageNo = 1;

  const promise = fetch(
    `${endPoint}?serviceKey=${serviceKey}&searchYearCd=${searchYearCd}&siDo=${siDo}&guGun=${goGun}&type=${type}&numOfRows=${numOfRows}&pageNo=${pageNo}`
  ).then((res) => {
    if (!res.ok) {
      throw res;
    }
    return res.json();
  });
  return promise;
}

export default function App() {
  return (
    <Router>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route
              index
              element={
                <AuthRequired>
                  <Main />
                </AuthRequired>
              }
            />
            <Route
              path="news"
              element={
                <AuthRequired>
                  <News />
                </AuthRequired>
              }
            />
            <Route
              path="video"
              element={
                <AuthRequired>
                  <Video />
                </AuthRequired>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </Router>
  );
}

function Main() {
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [data, setData] = useState(null);
  const [searchYearCd, setSearchYearCd] = useState(2015);

  console.log(data);

  useEffect(() => {
    setIsLoaded(false);

    fetchData(searchYearCd)
      .then((data) => {
        setData(data);
      })
      .catch((error) => {
        setError(error);
      })
      .finally(() => setIsLoaded(true));
  }, [searchYearCd]);

  if (error) {
    return <p>failed to fetch</p>;
  }

  if (!isLoaded) {
    return <p>fetching data...</p>;
  }

  return (
    <>
      <div className="px-20">

        <div className="text-center">
          <h1 className="text-4xl font-bold mt-8">
            인천광역시 부평구 보행노인 사고조회
          </h1>

          <h2 className="mt-4 text-xl">조회하실 연도를 선택하십시오</h2>
          <div className="flex justify-center mx-6 mt-5">
            <button
              className="p-1 border-2 border-black mr-10 rounded-lg hover:bg-red-400"
              onClick={() => setSearchYearCd(searchYearCd - 1)}
            >
              &#10094; 이전년도
            </button>
            <span className="text-2xl font-bold">{searchYearCd}</span>
            <button
              className="p-1 border-2 border-black ml-10 rounded-lg hover:bg-green-400"
              onClick={() => setSearchYearCd(searchYearCd + 1)}
            >
              다음년도 &#10095;
            </button>
          </div>
        </div>

        <div>
          {data.totalCount > 0 ? (
            <>
              <p className="text-xl text-center mt-5">
                {searchYearCd}부평구{" "}
                <span className="text-2xl text-red-500 font-bold">
                  총 {data.totalCount}건의 사고
                </span>
                가 발생했습니다
              </p>

              <h2 className="mt-4 font-bold mb-1">사고 현황</h2>
              <p className="text-sm newss-color-sm mb-1">그래프에 마우스를 올리면 현황이 나옵니다</p>
              <Rechart accidents={data.items.item} />

              <h2 className="mt-4 font-bold">지도&로드뷰</h2>
              <p className="text-sm newss-color-sm mb-1">지도 또는 로드뷰를 확대 또는 축소할 수 있습니다</p>
              <KakaoMap accidents={data.items.item} />
            </>
          ) : (
            <p>해당 년도 자료가 없습니다</p>
          )}
        </div>
      </div>
    </>
  );
}

const AuthContext = createContext();
function HashRouter(props) {
  const [user, setUser] = useState(null);
  // 로그인
  function signIn(username) {
    setUser(username);
  }
  // 로그아웃
  function signOut() {
    setUser(null);
  }
  const value = { user, signIn, signOut };

  return (
    <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>
  );
}


function Layout() {
  const auth = useContext(AuthContext);

  return (
    <>
      <nav className="block">
        <ul className="flex mt-2">
          <li className="border rounded-lg p-2 ml-2 hover:bg-green-300">
            <Link to="/">메인</Link>
          </li>
          <li className="border rounded-lg p-2 ml-2 hover:bg-green-300">
            <Link to="/news">뉴스 기사</Link>
          </li>
          <li className="border rounded-lg p-2 ml-2 hover:bg-green-300">
            <Link to="/video">관련 영상</Link>
          </li>
        </ul>
      </nav>
      {auth.user ? (
        <div className="flex justify-end">
          <span className="p-1">{auth.user} 님 안녕하세요</span>
          <button
            onClick={auth.signOut}
            className="border rounded-lg p-1 ml-2 hover:bg-red-100 mr-4"
          >
            로그아웃
          </button>
        </div>
      ) : (
        <span className="flex justify-center font-bold mt-40">로그인 해주세요!!</span>
      )}
      <Outlet />
      {/* 경로가 바뀌면 아웃렛 컨텐츠가 바뀐다 */}
    </>
  );
}

// 로그인 활성화
function AuthRequired(props) {
  const auth = useContext(AuthContext);
  console.log(auth);
  function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    // console.log(formData.get('username'))
    auth.signIn(formData.get("username"));
  }
  if (!auth.user) {
    return (
      <form onSubmit={handleSubmit} className="flex justify-center mt-2">
        <input
          type="text"
          name="username"
          required
          className="outline-orange-200"
        />
        <button
          type="submit"
          className="border rounded-lg p-2 ml-2 hover:bg-red-100"
        >
          로그인
        </button>
      </form>
    );
  }
  return props.children;
}


// 뉴스기사
function News() {
  return (
    <>
      <div className="mx-20 mt-8">
        <h1 className="text-xl">
          뉴스 기사 -{" "}
          <a
            href="https://bravo.etoday.co.kr/view/atc_view/13649"
            title="클릭시 해당 뉴스기사로 이동"
          >
            Link
          </a>
        </h1>
        <div>
          <h1 className="text-4xl font-bold">
            고령 보행자 사고 OECD 1위… 노인보호 대안은?
          </h1>
          <div className="my-8">
            <span className="text-sm newss-color-sm">
              기사입력 2022-06-17 13:57
            </span>
            <span className="text-sm ml-8 newss-color-sm">
              기사수정 2022-06-17 16:14
            </span>
          </div>
          <hr />
          <h3 className="text-xl font-bold my-8">
            전문가들 "실버존·스마트 횡단보도 확대" 한목소리
          </h3>
          <div className="flex justify-center text-center">
            <a
              href="https://bravo.etoday.co.kr/view/atc_view/13649"
              className="flex justify-center w-6/12 md:w-auto"
              title="클릭시 해당 뉴스기사로 이동"
            >
              <img
                src="https://img.etoday.co.kr/pto_db/2022/06/600/20220617161410_1765632_1199_800.jpg"
                alt="도로에서 위험하게 손수레를 끌고있는 노인(사징작가 이화진)"
                width="100%"
              />
            </a>
          </div>
          <div className="text-center mb-6">
            ▲서울시 종로구의 한 도로에서 위험하게 손수레를 끌고있는
            노인.&#40;사진작가 이화진&#41;
          </div>
          <div className="w-11/12 ">
            <p className="mt-2">
              교통사고분석시스템&#40;TAAS&#41;에 따르면 지난해 우리나라의 보행사상자의
              59%가 65세 이상 고령자로 나타났다. 아울러 OECD의 65세 이상 노인
              인구 10만 명당 보행 중 사망자수 통계에서도 압도적 1위로, 전체
              회원국 평균&#40;2.5명&#41;보다 4배에 가까운&#40;9.7명&#41; 수치를 기록했다.
            </p>
            <p className="mt-4">
              이에 노인의 무단횡단 등이 문제로 지적되기도 했으나, 행정안전부가
              발표한 &#10075;2017 노인 보행자 교통사고 다발지역 교통사고 특성&#10076; 통계
              등을 보면 안전운전 불이행&#40;68%&#41;이 가장 큰 이유로 꼽혔다. 그밖에
              교통사고가 지속 발생하는 장소 역시 시장, 병원 등 노인 유동인구가
              많은 곳으로 나타나며, 노인 보행자의 안전을 위한 노력이 촉구되는
              시점이다.
            </p>
            <p className="mt-4">
              그 노력의 일환으로 &#10075;노인보호구역&#10076; &#40;실버존, Silver Zone&#41;을 예로 들
              수 있다. 노인 보행자 사고가 증가함에 따라 이들의 안전한 통행을
              보장하기 위해 2008년부터 도입된 교통약자 보호 제도 인데, 노인들의
              통행량이 많은 구역을 선정해 차량 속도 제한 및 일정 시설을 설치하는
              형태다. 주로 경로당, 노인복지시설, 공원, 시장 인근을 지정하는데,
              사실상 그 존재가 미미하다.
            </p>
            <p className="mt-4">
              어린이보호구역&#40;스쿨존&#41;과 비교해 살펴보면, 먼저 그 숫자가 턱없이
              부족하다&#40;2021년 기준 스쿨존 1만 6700여 곳, 실버존 2600여 곳&#41;. 또
              두 곳 모두 해당 구역에서는 주정차가 금지되고 차량 운행 속도는 시속
              30km로 제한되지만, 실버존의 경우 12대 교통사고 중과실에 포함되지
              않아 사고가 났더라도 무조건 형사 처벌 대상이 되지는
              않는다&#40;어린이보호구역 안전운전의무 위반의 경우 포함&#41;.
            </p>
          </div>
          <div className="flex justify-center text-center mt-10">
            <a
              href="https://bravo.etoday.co.kr/view/atc_view/13649"
              className=" w-6/12 md:w-auto"
              title="클릭시 해당 뉴스기사로 이동"
            >
              <img
                src="https://img.etoday.co.kr/pto_db/2022/06/600/20220616170826_1765230_1200_989.jpg"
                alt="OECD회원국 평균 65세 이상 노인인구 10만 명당 보행 중 사망자수"
                width="100%"
              />
            </a>
          </div>
          <div className="text-center mb-10">&#40;OECD stats&#41;</div>
          <div className="w-11/12">
            <p className="mt-4">
              이에 최근 국가인권위원회는 행정안전부장관 및 경창철장에게
              노인보호구역 지정, 관리 실태 점검 및 확대, 대책 강화 방안 등을
              마련할 것을 권고했다. 이후 도로교통법 개정안에는 자동차 통행속도
              제한&#40;30km&#41; 및 무인 교통단속용 장비 설치 등을 통한 노인보호구역 내
              안전 강화에 대한 내용이 포함됐다.
            </p>
            <p className="mt-4">
              고령 보행자는 거동이 불편한 경우가 많아, 일반인에 비해 보행 신호
              시간이 부족할 수 있다. 자칫 사고로 이어질 위험성도 적지 않은데,
              이러한 점을 해결하기 위한 방안으로 ‘스마트 횡단보도’를 설치, 점차
              확대해나갈 전망이다. 한국건설기술연구원이 개발한 ‘스마트
              횡단보도’는 횡단보도에 사람이 접근하거나 신호가 끝났는데 아직
              머물러 있는 경우, 차량 운전자와 보행자 모두에게 음성 경고 신호를
              보낸다.
            </p>
          </div>
          <div className="flex justify-center text-center mt-10">
            <a
              href="https://bravo.etoday.co.kr/view/atc_view/13649"
              className="flex justify-center w-6/12 md:w-auto"
              title="클릭시 해당 뉴스기사로 이동"
            >
              <img
                src="https://img.etoday.co.kr/pto_db/2022/06/600/20220616170825_1765229_1199_899.jpg"
                alt="노인들이 신호를 무시한 채 횡단보도를 벗어나 보행하고 있다"
                width="100%"
              />
            </a>
          </div>
          <div className="text-center mb-10">
            ▲노인들이 신호를 무시한 채 횡단보도를 벗어나 보행하고 있다.&#40;이지혜
            기자 jyelee@&#41;
          </div>
          <div className="w-11/12">
            <p className="mt-4">
              그밖에 노인 무단횡단 사고의 경우, 무더위가 기승을 부리는 여름철
              더욱 위험성이 높아질 수 있다. 거동이 불편한 상태에서 무더위를
              이기지 못하고 무단횡단을 하는 노인이 적지 않다는 것. 이에 최근에는
              횡단보도 대기 중 더위를 막아주는 &#40;스마트&#41;그늘막이나 간이의자 등을
              설치해 이러한 사고를 방지하고 있다.
            </p>
            <p className="mt-4">
              도로교통공단 정책연구처 이세원 연구원은 “방호울타리
              무단횡단방지펜스 등도 고령자 무단횡단을 물리적으로 방지하는
              시설이다”라며 “넓은 대로에 있는 횡단보도의 경우 상대적으로 걸음이
              느린 고령 보행자들이 한번 쉬어갈 수 있도록 중앙보행섬이나
              횡단대기공간에 그늘막 등을 설치한다. 다만 중앙보행섬의 경우 설치
              목적과 다르게 대기 공간 내 안전상의 문제나 무단횡단을 더 유발할 수
              있다는 문제점을 지적하는 경우도 있다”고 설명했다.
            </p>
          </div>
          <div className="my-4">
            <span className="newss-color-sm">이지혜 기자</span>
            <a href="jyelee@etoday.co.kr" className="ml-2 newss-color-sm">
              jyelee@etoday.co.kr
            </a>
          </div>
          <div className="my-8">
            <a href="https://bravo.etoday.co.kr/section/search_list?varSrchKwd=%EA%B3%A0%EB%A0%B9%EB%B3%B4%ED%96%89%EC%9E%90" className="border rounded-full p-2 hover:bg-gray-600 mr-2">
              #고령보행자
            </a>
            <a href="https://bravo.etoday.co.kr/section/search_list?varSrchKwd=%EB%AC%B4%EB%8B%A8%ED%9A%A1%EB%8B%A8" className="border rounded-full p-2 hover:bg-gray-600 mr-2">
              #무단횡단
            </a>
            <a href="https://bravo.etoday.co.kr/section/search_list?varSrchKwd=%EC%8B%A4%EB%B2%84%EC%A1%B4" className="border rounded-full p-2 hover:bg-gray-600 mr-2">
              #실버존
            </a>
            <a href="https://bravo.etoday.co.kr/section/search_list?varSrchKwd=%EB%85%B8%EC%9D%B8%EB%B3%B4%ED%98%B8%EA%B5%AC%EC%97%B0" className="border rounded-full p-2 hover:bg-gray-600">
              #노인보호구역
            </a>
          </div>
          <hr />
        </div>
      </div>
    </>
  );
}

// 관련 영상
function Video() {
  // const params = useParams();
  // const postId = params.postId;

  return (
    <>
      <h1 className="text-xl mb-2 ml-4 font-bold mt-6">
        1. 고령자를 위해 꼭 필요한 교통안전교육&#40;※실제 사고영상, 시청주의&#41;
      </h1>
      <div className="bg-black flex justify-center my-8">
        <iframe
          width="1100"
          height="619"
          src="https://www.youtube.com/embed/U2Epo161gEc"
          title="고령자를 위해 꼭 필요한 교통안전교육(※실제 사고영상, 시청주의)"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      </div>
      <h1 className="text-xl mb-2 ml-4 font-bold mt-6">
        2. 늘어나는 고령자 보행 교통사고, 그 이유는?
      </h1>
      <div className="bg-black flex justify-center my-8">
        <iframe
          width="1100"
          height="619"
          src="https://www.youtube.com/embed/QKC99M45JJs"
          title="늘어나는 고령자 보행 교통사고, 그 이유는? | 행복한 아침 659 회"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      </div>
    </>
  );
}

// 에러메시지
function NotFound() {
  return <h1>404 NotFound</h1>;
}

// 리차트
function Rechart({ accidents }) {
  const chartData = accidents.map((accident) => {
    return {
      name: accident.spot_nm.substring(9),
      발생건수: accident.occrrnc_cnt,
      중상자수: accident.se_dnv_cnt,
      사망자수: accident.dth_dnv_cnt,
    };
  });
  return (
    <>
      <div style={{ height: "500px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            width={500}
            height={300}
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize="10px" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="발생건수" stroke="orange" />
            <Line type="monotone" dataKey="중상자수" stroke="green" />
            <Line type="monotone" dataKey="사망자수" stroke="black" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

// 카카오맵 지도&로드뷰
function KakaoMap({ accidents }) {
  const [toggle, setToggle] = useState("map");
  return (
    <div style={{ width: "100%", height: "500px", position: "relative", marginBottom: "3rem" }}>
      <Map // 로드뷰를 표시할 Container
        center={{ lat: accidents[0].la_crd, lng: accidents[0].lo_crd }}
        style={{
          display: toggle === "map" ? "block" : "none",
          width: "100%",
          height: "100%",
        }}
        level={7}
      >
        {accidents.map((accident) => (
          <MapMarker
            key={accident.spot_nm}
            // 마커를 표시할 위치
            position={{ lat: accident.la_crd, lng: accident.lo_crd }}
            // 마커의 타이틀, 마커에 마우스를 올리면 타이틀이 표시됩니다
            title={accident.spot_nm}
          />
        ))}
        {/* 로드뷰 보기 버튼 */}
        {toggle === "map" && (
          <input
            style={{
              position: "absolute",
              top: "5px",
              left: "5px",
              zIndex: 10,
            }}
            type="button"
            onClick={() => setToggle("roadview")}
            title="로드뷰 보기"
            value="로드뷰"
            className="border bg-green-300 p-1 radius"
          />
        )}
      </Map>
      {/* 실직적 로드뷰 */}
      {accidents.map((accident) => (
        <Roadview // 로드뷰를 표시할 Container
          key={accident.spot_nm}
          position={{
            ...{ lat: accident.la_crd, lng: accident.lo_crd },
            radius: 50,
          }}
          style={{
            display: toggle === "roadview" ? "inline-block" : "none",
            margin: "10px",
            marginLeft: "3rem",
            width: "45%",
            height: "100%",
          }}
        >
          {/* // 지도 보기 버튼 */}
          <RoadviewMarker
            position={{ lat: accident.la_crd, lng: accident.lo_crd }}
          />
          {toggle === "roadview" && (
            <input
              style={{
                position: "absolute",
                top: "5px",
                left: "5px",
                zIndex: 10,
              }}
              type="button"
              onClick={() => setToggle("map")}
              title="지도 보기"
              value="지도"
              className="border bg-green-300 p-1 radius"
            />
          )}
        </Roadview>
      ))}
    </div>
  );
}