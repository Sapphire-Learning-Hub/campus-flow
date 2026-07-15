import {
  ArrowLeftOutlined,
  BranchesOutlined,
  CalendarOutlined,
  EditOutlined,
  FieldTimeOutlined,
  PlusOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Progress, Space, Statistic, Tag } from "antd";
import "./ProjectDetail.css";

export default function ProjectDetailPage() {
  return (
    <div className="page-container project-detail-page">
      <Button className="back-button" type="text" icon={<ArrowLeftOutlined />}>
        返回项目列表
      </Button>

      <div
        className="project-detail-hero"
        style={{ "--project-color": "#1677ff" } as React.CSSProperties}
      >
        <span className="project-detail-symbol">智</span>

        <div className="project-detail-heading">
          <div>
            <h1>智能计划系统</h1>
            <p>支持任务权重、自动排程、拖拽时间表与休息时间插入的效率工具。</p>
          </div>

          <Space wrap>
            <Button icon={<PlusOutlined />}>创建任务</Button>
            <Button icon={<EditOutlined />}>编辑项目</Button>
          </Space>
        </div>
      </div>

      <nav className="detail-tab-bar">
        <button type="button" className="active">
          概览
        </button>
        <button type="button">工作项 4</button>
        <button type="button">
          <TeamOutlined /> 成员 6
        </button>
        <button type="button">动态记录</button>
      </nav>

      <section className="workspace-summary">
        <article>
          <span>
            <BranchesOutlined />
          </span>
          <small>开放工作项</small>
          <strong>4</strong>
          <em>4 项总计</em>
        </article>
        <article>
          <span>
            <FieldTimeOutlined />
          </span>
          <small>交付估分</small>
          <strong>21</strong>
          <em>团队点数</em>
        </article>
        <article className="risk">
          <span>
            <CalendarOutlined />
          </span>
          <small>逾期风险</small>
          <strong>1</strong>
          <em>需要处理</em>
        </article>
        <article>
          <span>
            <TeamOutlined />
          </span>
          <small>成员覆盖</small>
          <strong>6</strong>
          <em>协作角色</em>
        </article>
      </section>

      <section className="detail-grid">
        <article className="surface-panel detail-summary">
          <div className="section-heading">
            <div>
              <h2>项目概览</h2>
              <p>关键目标与时间信息</p>
            </div>
          </div>

          <dl className="detail-description-grid">
            <div>
              <dt>项目状态</dt>
              <dd>
                <Tag color="processing">进行中</Tag>
              </dd>
            </div>
            <div>
              <dt>项目负责人</dt>
              <dd>
                <span className="detail-member-inline">
                  <Avatar size={24} style={{ background: "#1677ff" }}>
                    张
                  </Avatar>
                  张伟
                </span>
              </dd>
            </div>
            <div>
              <dt>创建日期</dt>
              <dd>2026-06-10</dd>
            </div>
            <div>
              <dt>截止日期</dt>
              <dd>2026-08-20</dd>
            </div>
            <div className="full">
              <dt>项目描述</dt>
              <dd>
                支持任务权重、自动排程、拖拽时间表与休息时间插入的效率工具。
              </dd>
            </div>
          </dl>

          <div className="detail-progress">
            <div>
              <span>整体完成度</span>
              <b>38%</b>
            </div>
            <Progress percent={38} strokeColor="#1677ff" />
          </div>
        </article>

        <article className="surface-panel detail-stats">
          <Statistic title="项目任务" value={4} suffix="个" />
          <Statistic title="已完成" value={0} suffix="个" />
          <Statistic title="团队成员" value={6} suffix="人" />
          <Statistic title="距离截止" value={36} suffix="天" />
        </article>

        <article className="surface-panel detail-upcoming">
          <div className="section-heading">
            <div>
              <h2>临近任务</h2>
              <p>按截止日期优先显示</p>
            </div>
          </div>

          <div>
            <CalendarOutlined />
            <span>
              <b>修复跨天任务显示错位</b>
              <small>王强</small>
            </span>
            <time className="danger-text">2026-07-15</time>
          </div>
          <div>
            <CalendarOutlined />
            <span>
              <b>设计任务权重配置面板</b>
              <small>李明</small>
            </span>
            <time>2026-07-16</time>
          </div>
          <div>
            <CalendarOutlined />
            <span>
              <b>完成时间轴页面</b>
              <small>张伟</small>
            </span>
            <time>2026-07-18</time>
          </div>
          <div>
            <CalendarOutlined />
            <span>
              <b>任务完成后插入休息时间</b>
              <small>张伟</small>
            </span>
            <time>2026-07-20</time>
          </div>
        </article>
      </section>

      <section className="static-detail-section">
        <div className="section-heading outside">
          <div>
            <h2>工作项</h2>
            <p>项目中的任务与责任信息</p>
          </div>
        </div>

        <div className="surface-panel static-table-wrap">
          <table className="static-table">
            <thead>
              <tr>
                <th>工作项</th>
                <th>类型</th>
                <th>状态</th>
                <th>阶段</th>
                <th>优先级</th>
                <th>负责人</th>
                <th>计划</th>
                <th>估分</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>完成时间轴页面</td>
                <td>
                  <Tag>开发</Tag>
                </td>
                <td>
                  <Tag color="processing">进行中</Tag>
                </td>
                <td>
                  <Tag color="blue">交付</Tag>
                </td>
                <td>
                  <Tag color="orange">高</Tag>
                </td>
                <td>
                  <span className="detail-member-inline">
                    <Avatar size={24} style={{ background: "#1677ff" }}>
                      张
                    </Avatar>
                    张伟
                  </span>
                </td>
                <td>2026-07-13 - 2026-07-18</td>
                <td>8 点</td>
              </tr>
              <tr>
                <td>设计任务权重配置面板</td>
                <td>
                  <Tag>设计</Tag>
                </td>
                <td>
                  <Tag color="warning">待审核</Tag>
                </td>
                <td>
                  <Tag color="cyan">设计</Tag>
                </td>
                <td>
                  <Tag color="blue">中</Tag>
                </td>
                <td>
                  <span className="detail-member-inline">
                    <Avatar size={24} style={{ background: "#7c3aed" }}>
                      李
                    </Avatar>
                    李明
                  </span>
                </td>
                <td>2026-07-11 - 2026-07-16</td>
                <td>5 点</td>
              </tr>
              <tr>
                <td>修复跨天任务显示错位</td>
                <td>
                  <Tag color="red">缺陷</Tag>
                </td>
                <td>
                  <Tag>待处理</Tag>
                </td>
                <td>
                  <Tag color="gold">验收</Tag>
                </td>
                <td>
                  <Tag color="red">紧急</Tag>
                </td>
                <td>
                  <span className="detail-member-inline">
                    <Avatar size={24} style={{ background: "#0891b2" }}>
                      王
                    </Avatar>
                    王强
                  </span>
                </td>
                <td>2026-07-15 - 2026-07-15</td>
                <td>3 点</td>
              </tr>
              <tr>
                <td>任务完成后插入休息时间</td>
                <td>
                  <Tag>测试</Tag>
                </td>
                <td>
                  <Tag color="warning">待审核</Tag>
                </td>
                <td>
                  <Tag color="gold">验收</Tag>
                </td>
                <td>
                  <Tag color="orange">高</Tag>
                </td>
                <td>
                  <span className="detail-member-inline">
                    <Avatar size={24} style={{ background: "#1677ff" }}>
                      张
                    </Avatar>
                    张伟
                  </span>
                </td>
                <td>2026-07-16 - 2026-07-20</td>
                <td>5 点</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="static-detail-section">
        <div className="section-heading outside">
          <div>
            <h2>项目成员</h2>
            <p>项目角色与任务责任</p>
          </div>
        </div>

        <div className="detail-member-grid">
          <article>
            <Avatar size={56} style={{ background: "#1677ff" }}>
              张
            </Avatar>
            <h3>张伟</h3>
            <p>计算机学院</p>
            <Tag color="purple">所有者</Tag>
            <small>2 个负责任务</small>
          </article>
          <article>
            <Avatar size={56} style={{ background: "#7c3aed" }}>
              李
            </Avatar>
            <h3>李明</h3>
            <p>软件工程系</p>
            <Tag color="blue">管理员</Tag>
            <small>1 个负责任务</small>
          </article>
          <article>
            <Avatar size={56} style={{ background: "#0891b2" }}>
              王
            </Avatar>
            <h3>王强</h3>
            <p>人工智能学院</p>
            <Tag color="green">成员</Tag>
            <small>1 个负责任务</small>
          </article>
          <article>
            <Avatar size={56} style={{ background: "#ea580c" }}>
              赵
            </Avatar>
            <h3>赵敏</h3>
            <p>自动化学院</p>
            <Tag color="green">成员</Tag>
            <small>0 个负责任务</small>
          </article>
          <article>
            <Avatar size={56} style={{ background: "#16a34a" }}>
              陈
            </Avatar>
            <h3>陈晨</h3>
            <p>管理学院</p>
            <Tag>只读</Tag>
            <small>0 个负责任务</small>
          </article>
          <article>
            <Avatar size={56} style={{ background: "#db2777" }}>
              周
            </Avatar>
            <h3>周宁</h3>
            <p>计算机学院</p>
            <Tag color="green">成员</Tag>
            <small>0 个负责任务</small>
          </article>
        </div>
      </section>

      <section className="static-detail-section">
        <div className="section-heading outside">
          <div>
            <h2>动态记录</h2>
            <p>项目最近发生的变化</p>
          </div>
        </div>

        <div className="surface-panel activity-list">
          <article>
            <Avatar size={30} style={{ background: "#1677ff" }}>
              张
            </Avatar>
            <div>
              <p>
                <b>张伟</b> 更新了项目整体进度
              </p>
              <small>2026-07-15 20:30</small>
            </div>
          </article>
          <article>
            <Avatar size={30} style={{ background: "#7c3aed" }}>
              李
            </Avatar>
            <div>
              <p>
                <b>李明</b> 将“设计任务权重配置面板”提交审核
              </p>
              <small>2026-07-15 16:20</small>
            </div>
          </article>
          <article>
            <Avatar size={30} style={{ background: "#0891b2" }}>
              王
            </Avatar>
            <div>
              <p>
                <b>王强</b> 新增了缺陷“修复跨天任务显示错位”
              </p>
              <small>2026-07-15 11:05</small>
            </div>
          </article>
          <article>
            <Avatar size={30} style={{ background: "#16a34a" }}>
              陈
            </Avatar>
            <div>
              <p>
                <b>陈晨</b> 完成了“整理链接解析规则”
              </p>
              <small>2026-07-14 18:45</small>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
