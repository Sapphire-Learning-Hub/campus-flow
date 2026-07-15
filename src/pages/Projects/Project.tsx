import "./Project.css";
import { PageHeader } from "@/components/common/PageHeader.tsx";
import {
  AppstoreOutlined,
  CalendarOutlined,
  FlagOutlined,
  PlusOutlined,
  ProjectOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined,
  WarningFilled,
} from "@ant-design/icons";
import { Avatar, Button, Card, Progress, Tag } from "antd";

const Project = () => {
  return (
    <div className="page-container">
      <PageHeader
        title={"项目"}
        description={"集中管理课程项目,团队协作与社团活动"}
        actions={
          <Button type="primary" icon={<PlusOutlined />}>
            创建项目
          </Button>
        }
      />
      <section className="workspace-summary">
        <article>
          <span>
            <ProjectOutlined />
          </span>
          <small>项目空间</small>
          <strong>4</strong>
          <em>2 个进行中</em>
        </article>
        <article>
          <span>
            <FlagOutlined />
          </span>
          <small>收藏空间</small>
          <strong>3</strong>
          <em>优先跟进</em>
        </article>
        <article>
          <span>
            <CalendarOutlined />
          </span>
          <small>工作项</small>
          <strong>8</strong>
          <em>跨空间协作</em>
        </article>
        <article className="risk">
          <span>
            <WarningFilled />
          </span>
          <small>风险空间</small>
          <strong>1</strong>
          <em>存在逾期</em>
        </article>
      </section>

      <div className="project-scope-tabs">
        <button type="button" className="active">
          <span>全部空间</span>
          <b>4</b>
        </button>
        <button type="button">
          <span>进行中</span>
          <b>2</b>
        </button>
        <button type="button">
          <span>我的收藏</span>
          <b>3</b>
        </button>
        <button type="button">
          <span>风险空间</span>
          <b>1</b>
        </button>
      </div>

      <div className="data-toolbar">
        <label className="search-box">
          <SearchOutlined />
          <input type="text" placeholder="搜索项目名称" />
        </label>

        <select className="native-select" defaultValue="">
          <option value="">全部状态</option>
          <option>规划中</option>
          <option>进行中</option>
          <option>已完成</option>
          <option>已归档</option>
        </select>

        <select className="native-select" defaultValue="updated">
          <option value="updated">最近更新</option>
          <option value="created">创建时间</option>
          <option value="deadline">截止时间</option>
        </select>

        <span className="toolbar-meta">4 个项目 · 3 个收藏</span>
        <Button>清空筛选</Button>
      </div>

      <section className="static-section">
        <div className="section-heading">
          <div>
            <h2>卡片布局</h2>
            <p>项目空间概览</p>
          </div>
        </div>

        <div className="project-grid">
          <Card className="project-card" hoverable>
            <div className="project-card-top">
              <span className="project-card-symbol blue">
                <AppstoreOutlined />
              </span>
              <Button
                type="text"
                className="favorite-btn"
                icon={<StarFilled />}
              />
            </div>
            <h2>智能计划系统</h2>
            <p>支持任务权重、自动排程、拖拽时间表与休息时间插入的效率工具。</p>
            <div className="project-card-meta">
              <Tag color="processing">进行中</Tag>
              <span>6 名成员</span>
              <span>2026-08-20 截止</span>
            </div>
            <div className="project-card-insights">
              <span>
                <b>4</b> 工作项
              </span>
              <span>
                <b>4</b> 未完成
              </span>
              <span className="danger-text">
                <b>1</b> 逾期
              </span>
            </div>
            <div className="project-card-progress">
              <div>
                <span>项目进度</span>
                <b>38%</b>
              </div>
              <Progress percent={38} showInfo={false} />
            </div>
            <div className="project-card-footer">
              <span className="project-leader">
                <Avatar size={26} style={{ background: "#1677ff" }}>
                  张
                </Avatar>
                张伟
              </span>
              <Button type="link">查看详情</Button>
            </div>
          </Card>

          <Card className="project-card" hoverable>
            <div className="project-card-top">
              <span className="project-card-symbol purple">
                <AppstoreOutlined />
              </span>
              <Button
                type="text"
                className="favorite-btn"
                icon={<StarFilled />}
              />
            </div>
            <h2>团队协作平台</h2>
            <p>
              面向课程项目和社团活动的成员、权限、工作项与动态记录管理平台。
            </p>
            <div className="project-card-meta">
              <Tag color="processing">进行中</Tag>
              <span>4 名成员</span>
              <span>2026-09-05 截止</span>
            </div>
            <div className="project-card-insights">
              <span>
                <b>2</b> 工作项
              </span>
              <span>
                <b>2</b> 未完成
              </span>
              <span>
                <b>0</b> 逾期
              </span>
            </div>
            <div className="project-card-progress">
              <div>
                <span>项目进度</span>
                <b>54%</b>
              </div>
              <Progress percent={54} showInfo={false} strokeColor="#7c3aed" />
            </div>
            <div className="project-card-footer">
              <span className="project-leader">
                <Avatar size={26} style={{ background: "#7c3aed" }}>
                  李
                </Avatar>
                李明
              </span>
              <Button type="link">查看详情</Button>
            </div>
          </Card>

          <Card className="project-card" hoverable>
            <div className="project-card-top">
              <span className="project-card-symbol cyan">
                <AppstoreOutlined />
              </span>
              <Button
                type="text"
                className="favorite-btn"
                icon={<StarOutlined />}
              />
            </div>
            <h2>链接解析服务</h2>
            <p>
              解析课程、视频、文档和网页链接，提取标题、摘要、封面与预计时长。
            </p>
            <div className="project-card-meta">
              <Tag color="gold">规划中</Tag>
              <span>3 名成员</span>
              <span>2026-08-12 截止</span>
            </div>
            <div className="project-card-insights">
              <span>
                <b>1</b> 工作项
              </span>
              <span>
                <b>0</b> 未完成
              </span>
              <span>
                <b>0</b> 逾期
              </span>
            </div>
            <div className="project-card-progress">
              <div>
                <span>项目进度</span>
                <b>100%</b>
              </div>
              <Progress percent={100} showInfo={false} strokeColor="#0891b2" />
            </div>
            <div className="project-card-footer">
              <span className="project-leader">
                <Avatar size={26} style={{ background: "#0891b2" }}>
                  王
                </Avatar>
                王强
              </span>
              <Button type="link">查看详情</Button>
            </div>
          </Card>

          <Card className="project-card" hoverable>
            <div className="project-card-top">
              <span className="project-card-symbol green">
                <AppstoreOutlined />
              </span>
              <Button
                type="text"
                className="favorite-btn"
                icon={<StarFilled />}
              />
            </div>
            <h2>前端学习资料库</h2>
            <p>
              按阶段整理 HTML、CSS、JavaScript、TypeScript 与 React 学习笔记。
            </p>
            <div className="project-card-meta">
              <Tag color="success">已完成</Tag>
              <span>3 名成员</span>
              <span>2026-07-10 截止</span>
            </div>
            <div className="project-card-insights">
              <span>
                <b>1</b> 工作项
              </span>
              <span>
                <b>0</b> 未完成
              </span>
              <span>
                <b>0</b> 逾期
              </span>
            </div>
            <div className="project-card-progress">
              <div>
                <span>项目进度</span>
                <b>100%</b>
              </div>
              <Progress percent={100} showInfo={false} strokeColor="#16a34a" />
            </div>
            <div className="project-card-footer">
              <span className="project-leader">
                <Avatar size={26} style={{ background: "#16a34a" }}>
                  陈
                </Avatar>
                陈晨
              </span>
              <Button type="link">查看详情</Button>
            </div>
          </Card>
        </div>
      </section>

      <section className="static-section">
        <div className="section-heading">
          <div>
            <h2>列表布局</h2>
            <p>项目详细字段</p>
          </div>
        </div>

        <div className="surface-panel static-table-wrap">
          <table className="static-table">
            <thead>
              <tr>
                <th>项目</th>
                <th>状态</th>
                <th>负责人</th>
                <th>进度</th>
                <th>工作项</th>
                <th>截止日期</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="table-project-name">
                    <span className="project-line blue-bg" />
                    <span>
                      <b>智能计划系统</b>
                      <small>支持任务权重、自动排程与时间表管理</small>
                    </span>
                  </div>
                </td>
                <td>
                  <Tag color="processing">进行中</Tag>
                </td>
                <td>
                  <span className="project-leader">
                    <Avatar size={26} style={{ background: "#1677ff" }}>
                      张
                    </Avatar>
                    张伟
                  </span>
                </td>
                <td>
                  <Progress percent={38} size="small" />
                </td>
                <td>4 未完成 · 2 待审</td>
                <td>2026-08-20</td>
              </tr>
              <tr>
                <td>
                  <div className="table-project-name">
                    <span className="project-line purple-bg" />
                    <span>
                      <b>团队协作平台</b>
                      <small>成员、权限、工作项与动态管理</small>
                    </span>
                  </div>
                </td>
                <td>
                  <Tag color="processing">进行中</Tag>
                </td>
                <td>
                  <span className="project-leader">
                    <Avatar size={26} style={{ background: "#7c3aed" }}>
                      李
                    </Avatar>
                    李明
                  </span>
                </td>
                <td>
                  <Progress percent={54} size="small" strokeColor="#7c3aed" />
                </td>
                <td>2 未完成 · 0 待审</td>
                <td>2026-09-05</td>
              </tr>
              <tr>
                <td>
                  <div className="table-project-name">
                    <span className="project-line cyan-bg" />
                    <span>
                      <b>链接解析服务</b>
                      <small>解析网页、视频、文档和课程链接</small>
                    </span>
                  </div>
                </td>
                <td>
                  <Tag color="gold">规划中</Tag>
                </td>
                <td>
                  <span className="project-leader">
                    <Avatar size={26} style={{ background: "#0891b2" }}>
                      王
                    </Avatar>
                    王强
                  </span>
                </td>
                <td>
                  <Progress percent={100} size="small" strokeColor="#0891b2" />
                </td>
                <td>0 未完成 · 0 待审</td>
                <td>2026-08-12</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
export default Project;
