-- 管理库完整表结构：启动自动创建，所有表保留中文说明及统一审计字段。

-- 存量结构由 DatabaseAuditMigration 增量补齐；保留现有业务数据和历史字段。

SET NAMES utf8mb4;


-- ============================================================
-- 1. job_group: 执行器分组表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_group` (
    `id`            INT(11)       NOT NULL AUTO_INCREMENT COMMENT '主键标识',
    `app_name`      VARCHAR(64)   NOT NULL COMMENT '执行器AppName',
    `title`         VARCHAR(32)   NOT NULL COMMENT '执行器名称',
    `order`         INT(11)       NOT NULL DEFAULT 0 COMMENT '排序',
    `address_type`  TINYINT(4)    NOT NULL DEFAULT 0 COMMENT '执行器地址类型：0=自动注册、1=手动录入',
    `address_list`  VARCHAR(512)      NULL DEFAULT NULL COMMENT '执行器地址列表，多地址逗号分隔',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
    `created_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '创建人标识或账号',
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '修改时间',
    `updated_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '修改人标识或账号',
    PRIMARY KEY (`id`)
)  COMMENT='执行器分组';

-- ============================================================
-- 2. job_info: 任务配置表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_info` (
    `id`                         INT(11)       NOT NULL AUTO_INCREMENT COMMENT '主键标识',
    `job_group`                  INT(11)       NOT NULL COMMENT '执行器主键ID',
    `job_cron`                   VARCHAR(128)  NOT NULL COMMENT '任务执行CRON',
    `job_desc`                   VARCHAR(255)  NOT NULL COMMENT '任务名称与说明',
    `add_time`                   DATETIME(0)       NULL DEFAULT NULL COMMENT '原有创建时间',
    `update_time`                DATETIME(0)       NULL DEFAULT NULL COMMENT '原有更新时间',
    `user_id`                    INT(11)       NOT NULL COMMENT '所属或修改用户标识',
    `alarm_email`                VARCHAR(255)      NULL DEFAULT NULL COMMENT '报警邮件',
    `executor_route_strategy`    VARCHAR(50)       NULL DEFAULT NULL COMMENT '执行器路由策略',
    `executor_handler`           VARCHAR(255)      NULL DEFAULT NULL COMMENT '执行器任务handler',
    `executor_param`             VARCHAR(512)      NULL DEFAULT NULL COMMENT '执行器任务参数',
    `executor_block_strategy`    VARCHAR(50)       NULL DEFAULT NULL COMMENT '阻塞处理策略',
    `executor_timeout`           INT(11)       NOT NULL DEFAULT '0' COMMENT '执行超时时间，单位秒',
    `executor_fail_retry_count`  INT(11)       NOT NULL DEFAULT 0 COMMENT '失败重试次数',
    `glue_type`                  VARCHAR(50)   NOT NULL COMMENT '执行类型：DataX或脚本',
    `glue_source`                MEDIUMTEXT        NULL COMMENT '脚本内容',
    `glue_remark`                VARCHAR(128)      NULL DEFAULT NULL COMMENT '脚本版本说明',
    `glue_updatetime`            DATETIME(0)       NULL DEFAULT NULL COMMENT '脚本更新时间',
    `child_jobid`                VARCHAR(255)      NULL DEFAULT NULL COMMENT '子任务ID，多个逗号分隔',
    `trigger_status`             TINYINT(4)    NOT NULL DEFAULT 0 COMMENT '调度状态：0-停止，1-运行',
    `trigger_last_time`          BIGINT(13)    NOT NULL DEFAULT 0 COMMENT '上次计划触发时间戳（毫秒）',
    `trigger_next_time`          BIGINT(13)    NOT NULL DEFAULT 0 COMMENT '下次计划触发时间戳（毫秒）',
    `job_json`                   TEXT              NULL COMMENT '加密保存的DataX运行配置',
    `replace_param`              VARCHAR(100)      NULL DEFAULT NULL COMMENT '增量运行参数',
    `jvm_param`                  VARCHAR(200)      NULL DEFAULT NULL COMMENT 'Java虚拟机启动参数',
    `inc_start_time`             DATETIME          NULL DEFAULT NULL COMMENT '增量同步起始时间',
    `partition_info`             VARCHAR(100)      NULL DEFAULT NULL COMMENT '分区字段与时间格式配置',
    `last_handle_code`           INT(11)           NULL DEFAULT '0' COMMENT '最近一次执行结果状态码',
    `replace_param_type`         VARCHAR(255)      NULL COMMENT '增量时间格式',
    `project_id`                 INT(11)           NULL COMMENT '所属项目标识',
    `reader_table`               VARCHAR(255)      NULL COMMENT '读取表名',
    `primary_key`                VARCHAR(50)       NULL COMMENT '增量主键字段',
    `inc_start_id`               VARCHAR(20)       NULL COMMENT '增量同步起始主键',
    `increment_type`             TINYINT(4)        NULL DEFAULT 0 COMMENT '同步方式：0全量、1主键增量、2时间增量、3分区',
    `datasource_id`              BIGINT(11)        NULL COMMENT '数据源标识',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
    `created_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '创建人标识或账号',
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '修改时间',
    `updated_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '修改人标识或账号',
    PRIMARY KEY (`id`)
)  COMMENT='数据同步调度任务';

-- ============================================================
-- 3. job_jdbc_datasource: JDBC数据源配置表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_jdbc_datasource` (
    `id`                 BIGINT(20)     NOT NULL AUTO_INCREMENT COMMENT '主键标识',
    `datasource_name`    VARCHAR(200)   NOT NULL COMMENT '数据源名称',
    `datasource_group`   VARCHAR(200)       NULL DEFAULT 'Default' COMMENT '数据源分组',
    `jdbc_username`      VARCHAR(100)       NULL DEFAULT NULL COMMENT '用户名',
    `jdbc_password`      VARCHAR(200)       NULL DEFAULT NULL COMMENT '密码',
    `jdbc_url`           VARCHAR(500)   NOT NULL COMMENT 'JDBC连接地址',
    `jdbc_driver_class`  VARCHAR(200)       NULL DEFAULT NULL COMMENT 'JDBC驱动类名',
    `datasource`         VARCHAR(45)    NOT NULL COMMENT '数据源',
    `zk_adress`          VARCHAR(200)       NULL DEFAULT NULL COMMENT 'ZooKeeper节点地址',
    `database_name`      VARCHAR(45)        NULL DEFAULT NULL COMMENT '数据库名',
    `status`             TINYINT(1)     NOT NULL DEFAULT 1 COMMENT '状态：0删除 1启用 2禁用',
    `create_by`          VARCHAR(20)        NULL DEFAULT NULL COMMENT '创建人',
    `create_date`        DATETIME(0)        NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '创建时间',
    `update_by`          VARCHAR(20)        NULL DEFAULT NULL COMMENT '更新人',
    `update_date`        DATETIME(0)        NULL DEFAULT NULL COMMENT '更新时间',
    `comments`           VARCHAR(1000)      NULL DEFAULT NULL COMMENT '备注',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
    `created_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '创建人标识或账号',
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '修改时间',
    `updated_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '修改人标识或账号',
    PRIMARY KEY (`id`)
)  COMMENT='数据库连接配置';

-- ============================================================
-- 4. job_lock: 调度锁表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_lock` (
    `lock_name`  VARCHAR(50)  NOT NULL COMMENT '锁名称',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
    `created_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '创建人标识或账号',
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '修改时间',
    `updated_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '修改人标识或账号',
    PRIMARY KEY (`lock_name`)
)  COMMENT='调度协调锁';

-- ============================================================
-- 5. job_log: 任务执行日志表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_log` (
    `id`                         BIGINT(20)    NOT NULL AUTO_INCREMENT COMMENT '主键标识',
    `job_group`                  INT(11)       NOT NULL COMMENT '执行器主键ID',
    `job_id`                     INT(11)       NOT NULL COMMENT '任务，主键ID',
    `job_desc`                   VARCHAR(255)      NULL DEFAULT NULL COMMENT '任务名称与说明',
    `executor_address`           VARCHAR(255)      NULL DEFAULT NULL COMMENT '执行器地址，本次执行的地址',
    `executor_handler`           VARCHAR(255)      NULL DEFAULT NULL COMMENT '执行器任务handler',
    `executor_param`             VARCHAR(512)      NULL DEFAULT NULL COMMENT '执行器任务参数',
    `executor_sharding_param`    VARCHAR(20)       NULL DEFAULT NULL COMMENT '执行器任务分片参数，格式如 1/2',
    `executor_fail_retry_count`  INT(11)           NULL DEFAULT 0 COMMENT '失败重试次数',
    `trigger_time`               DATETIME(0)       NULL DEFAULT NULL COMMENT '调度-时间',
    `trigger_code`               INT(11)       NOT NULL COMMENT '调度-结果',
    `trigger_msg`                TEXT              NULL COMMENT '调度-日志',
    `handle_time`                DATETIME(0)       NULL DEFAULT NULL COMMENT '执行-时间',
    `handle_code`                INT(11)       NOT NULL COMMENT '执行-状态',
    `handle_msg`                 TEXT              NULL COMMENT '执行-日志',
    `alarm_status`               TINYINT(4)    NOT NULL DEFAULT 0 COMMENT '告警状态：0-默认、1-无需告警、2-告警成功、3-告警失败',
    `process_id`                 VARCHAR(20)       NULL DEFAULT NULL COMMENT 'DataX执行进程标识',
    `max_id`                     BIGINT(20)        NULL DEFAULT NULL COMMENT '本次增量同步最大主键',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
    `created_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '创建人标识或账号',
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '修改时间',
    `updated_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '修改人标识或账号',
    PRIMARY KEY (`id`),
    KEY `I_trigger_time` (`trigger_time`),
    KEY `I_handle_code` (`handle_code`)
)  COMMENT='任务执行日志';

-- ============================================================
-- 6. job_log_report: 任务日志统计表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_log_report` (
    `id`             INT(11)      NOT NULL AUTO_INCREMENT COMMENT '主键标识',
    `trigger_day`    DATETIME(0)      NULL DEFAULT NULL COMMENT '调度-时间',
    `running_count`  INT(11)      NOT NULL DEFAULT 0 COMMENT '运行中-日志数量',
    `suc_count`      INT(11)      NOT NULL DEFAULT 0 COMMENT '执行成功-日志数量',
    `fail_count`     INT(11)      NOT NULL DEFAULT 0 COMMENT '执行失败-日志数量',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
    `created_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '创建人标识或账号',
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '修改时间',
    `updated_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '修改人标识或账号',
    PRIMARY KEY (`id`),
    UNIQUE KEY `i_trigger_day` (`trigger_day`)
)  COMMENT='任务执行统计';

-- ============================================================
-- 7. job_logglue: GLUE代码历史表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_logglue` (
    `id`           INT(11)       NOT NULL AUTO_INCREMENT COMMENT '主键标识',
    `job_id`       INT(11)       NOT NULL COMMENT '任务，主键ID',
    `glue_type`    VARCHAR(50)       NULL DEFAULT NULL COMMENT '执行类型：DataX或脚本',
    `glue_source`  MEDIUMTEXT        NULL COMMENT '脚本内容',
    `glue_remark`  VARCHAR(128)  NOT NULL COMMENT '脚本版本说明',
    `add_time`     DATETIME(0)       NULL DEFAULT NULL COMMENT '原有创建时间',
    `update_time`  DATETIME(0)       NULL DEFAULT NULL COMMENT '原有更新时间',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
    `created_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '创建人标识或账号',
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '修改时间',
    `updated_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '修改人标识或账号',
    PRIMARY KEY (`id`)
)  COMMENT='脚本版本历史';

-- ============================================================
-- 8. job_registry: 执行器注册表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_registry` (
    `id`              INT(11)       NOT NULL AUTO_INCREMENT COMMENT '主键标识',
    `registry_group`  VARCHAR(50)   NOT NULL COMMENT '注册节点类型',
    `registry_key`    VARCHAR(191)  NOT NULL COMMENT '执行器分组标识',
    `registry_value`  VARCHAR(191)  NOT NULL COMMENT '执行器注册地址',
    `cpu_usage`       DOUBLE            NULL COMMENT 'CPU使用率',
    `memory_usage`    DOUBLE            NULL COMMENT '内存使用率',
    `load_average`    DOUBLE            NULL COMMENT '负载平均值',
    `update_time`     DATETIME(0)       NULL DEFAULT NULL COMMENT '原有更新时间',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
    `created_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '创建人标识或账号',
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '修改时间',
    `updated_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '修改人标识或账号',
    PRIMARY KEY (`id`),
    KEY `i_g_k_v` (`registry_group`, `registry_key`, `registry_value`)
)  COMMENT='执行器注册与资源指标';

-- ============================================================
-- 9. job_user: 用户表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_user` (
    `id`          INT(11)       NOT NULL AUTO_INCREMENT COMMENT '主键标识',
    `username`    VARCHAR(50)   NOT NULL COMMENT '账号',
    `password`    VARCHAR(100)  NOT NULL COMMENT '密码',
    `role`        VARCHAR(50)       NULL DEFAULT NULL COMMENT '用户角色：ROLE_USER普通用户、ROLE_ADMIN管理员',
    `permission`  VARCHAR(255)      NULL DEFAULT NULL COMMENT '权限：执行器ID列表，多个逗号分割',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
    `created_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '创建人标识或账号',
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '修改时间',
    `updated_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '修改人标识或账号',
    PRIMARY KEY (`id`),
    UNIQUE KEY `i_username` (`username`)
)  COMMENT='平台用户';

-- ============================================================
-- 10. job_template: 任务模板表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_template` (
    `id`                        INT(11)       NOT NULL AUTO_INCREMENT COMMENT '主键标识',
    `job_group`                 INT(11)       NOT NULL COMMENT '执行器主键ID',
    `project_id`                INT(11)           NULL DEFAULT NULL COMMENT '所属项目标识',
    `job_cron`                  VARCHAR(128)  NOT NULL COMMENT '任务执行CRON',
    `job_desc`                  VARCHAR(255)  NOT NULL COMMENT '任务名称与说明',
    `alarm_email`               VARCHAR(255)      NULL DEFAULT NULL COMMENT '报警邮件',
    `executor_route_strategy`   VARCHAR(50)       NULL DEFAULT NULL COMMENT '执行器路由策略',
    `executor_handler`          VARCHAR(255)      NULL DEFAULT NULL COMMENT '执行器任务handler',
    `executor_param`            VARCHAR(512)      NULL DEFAULT NULL COMMENT '执行器参数',
    `executor_block_strategy`   VARCHAR(50)       NULL DEFAULT NULL COMMENT '阻塞处理策略',
    `executor_timeout`          INT(11)       NOT NULL DEFAULT 0 COMMENT '执行超时时间，单位秒',
    `executor_fail_retry_count` INT(11)       NOT NULL DEFAULT 0 COMMENT '失败重试次数',
    `glue_type`                 VARCHAR(50)   NOT NULL COMMENT '执行类型：DataX或脚本',
    `glue_source`               MEDIUMTEXT        NULL COMMENT '脚本内容',
    `glue_remark`               VARCHAR(128)      NULL DEFAULT NULL COMMENT '脚本版本说明',
    `glue_updatetime`           DATETIME(0)       NULL DEFAULT NULL COMMENT '脚本更新时间',
    `child_jobid`               VARCHAR(255)      NULL DEFAULT NULL COMMENT '子任务ID，多个逗号分隔',
    `trigger_last_time`         BIGINT(13)    NOT NULL DEFAULT 0 COMMENT '上次计划触发时间戳（毫秒）',
    `trigger_next_time`         BIGINT(13)    NOT NULL DEFAULT 0 COMMENT '下次计划触发时间戳（毫秒）',
    `job_json`                  TEXT              NULL COMMENT '加密保存的DataX运行配置',
    `jvm_param`                 VARCHAR(200)      NULL DEFAULT NULL COMMENT 'Java虚拟机启动参数',
    `add_time`                  DATETIME(0)       NULL DEFAULT NULL COMMENT '原有创建时间',
    `update_time`               DATETIME(0)       NULL DEFAULT NULL COMMENT '原有更新时间',
    `user_id`                   INT(11)       NOT NULL COMMENT '所属或修改用户标识',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
    `created_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '创建人标识或账号',
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '修改时间',
    `updated_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '修改人标识或账号',
    PRIMARY KEY (`id`)
)  COMMENT='调度任务模板';

-- ============================================================
-- 11. job_permission: 权限表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_permission` (
    `id`           INT(11)       NOT NULL AUTO_INCREMENT COMMENT '主键标识',
    `name`         VARCHAR(50)   NOT NULL COMMENT '名称',
    `description`  VARCHAR(11)       NULL DEFAULT NULL COMMENT '说明',
    `url`          VARCHAR(255)      NULL DEFAULT NULL COMMENT '权限资源地址',
    `pid`          INT(11)           NULL DEFAULT NULL COMMENT '上级权限标识',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
    `created_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '创建人标识或账号',
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '修改时间',
    `updated_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '修改人标识或账号',
    PRIMARY KEY (`id`)
)  COMMENT='访问权限';

-- ============================================================
-- 12. job_project: 项目表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_project_datasource` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键标识',
  `project_id` int NOT NULL COMMENT '所属项目标识',
  `datasource_id` bigint NOT NULL COMMENT '数据源标识',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
    `created_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '创建人标识或账号',
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '修改时间',
    `updated_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '修改人标识或账号',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_datasource` (`project_id`, `datasource_id`),
  KEY `idx_project_datasource_source` (`datasource_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目与数据源关联';

CREATE TABLE IF NOT EXISTS `job_project` (
    `id`           INT(11)       NOT NULL AUTO_INCREMENT COMMENT '主键标识',
    `name`         VARCHAR(100)      NULL DEFAULT NULL COMMENT '名称',
    `description`  VARCHAR(200)      NULL DEFAULT NULL COMMENT '说明',
    `user_id`      INT(11)           NULL DEFAULT NULL COMMENT '所属或修改用户标识',
    `flag`         TINYINT(4)        NULL DEFAULT 1 COMMENT '是否有效：0无效、1有效',
    `create_time`  DATETIME(0)       NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '原有创建时间',
    `update_time`  DATETIME(0)       NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '原有更新时间',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
    `created_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '创建人标识或账号',
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '修改时间',
    `updated_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '修改人标识或账号',
    PRIMARY KEY (`id`)
)  COMMENT='迁移项目';

-- ============================================================
-- 13. job_json_template: JSON任务模板表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_json_template` (
    `id`                    BIGINT         NOT NULL AUTO_INCREMENT COMMENT '主键标识',
    `name`                  VARCHAR(100)   NOT NULL COMMENT '名称',
    `description`           VARCHAR(1000)           DEFAULT NULL COMMENT '说明',
    `owner_id`              INT            NOT NULL COMMENT '所属用户标识',
    `reader_datasource_id`  BIGINT         NOT NULL COMMENT '实际读取数据源标识',
    `writer_datasource_id`  BIGINT         NOT NULL COMMENT '实际写入数据源标识',
    `build_config`          LONGTEXT       NOT NULL COMMENT '配置方案内容',
    `job_json`              LONGTEXT       NOT NULL COMMENT '加密保存的DataX运行配置',
    `version`               INT            NOT NULL DEFAULT 1 COMMENT '乐观锁版本号',
    `create_time`           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '原有创建时间',
    `update_time`           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '原有更新时间',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
    `created_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '创建人标识或账号',
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '修改时间',
    `updated_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '修改人标识或账号',
    PRIMARY KEY (`id`),
    KEY `idx_json_template_owner` (`owner_id`, `update_time`)
)  COMMENT='DataX配置模板';

-- ============================================================
-- 14. job_json_batch_sequence: JSON批次流水号表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_json_batch_sequence` (
    `issue_day`      DATE    NOT NULL COMMENT '发号日期',
    `current_value`  BIGINT  NOT NULL COMMENT '当日已发放流水号',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
    `created_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '创建人标识或账号',
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '修改时间',
    `updated_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '修改人标识或账号',
    PRIMARY KEY (`issue_day`)
)  COMMENT='配置批次每日发号器';

-- ============================================================
-- 15. job_json_batch: JSON批次表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_json_batch` (
    `id`           VARCHAR(64)   NOT NULL COMMENT '主键标识',
    `batch_code`   VARCHAR(32)   NOT NULL COMMENT '批次编码',
    `owner_id`     INT           NOT NULL COMMENT '所属用户标识',
    `name`         VARCHAR(100)  NOT NULL DEFAULT '' COMMENT '名称',
    `create_time`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '原有创建时间',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
    `created_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '创建人标识或账号',
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '修改时间',
    `updated_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '修改人标识或账号',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_json_batch_code` (`batch_code`),
    KEY `idx_json_batch_owner` (`owner_id`, `create_time`)
)  COMMENT='配置生成批次';

-- ============================================================
-- 16. job_json_batch_item: JSON批次明细表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_json_batch_item` (
    `template_id`  BIGINT       NOT NULL COMMENT '配置模板标识',
    `batch_id`     VARCHAR(64)  NOT NULL COMMENT '所属批次标识',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
    `created_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '创建人标识或账号',
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '修改时间',
    `updated_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '修改人标识或账号',
    PRIMARY KEY (`template_id`),
    KEY `idx_json_batch_item` (`batch_id`, `template_id`)
)  COMMENT='配置批次与模板关联';



-- 项目可复用配置：只保存连接标识、表字段、SQL及生成选项，不保存业务库数据。
CREATE TABLE IF NOT EXISTS `job_project_recipe` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键标识',
  `project_id` INT NOT NULL COMMENT '所属项目标识',
  `owner_id` INT NOT NULL COMMENT '创建用户标识',
  `name` VARCHAR(100) NOT NULL COMMENT '配置方案名称',
  `description` VARCHAR(1000) NOT NULL DEFAULT '' COMMENT '方案用途说明',
  `mode` VARCHAR(16) NOT NULL DEFAULT 'MAPPING' COMMENT '读取方式：MAPPING字段映射、QUERY查询SQL',
  `configuration` LONGTEXT NOT NULL COMMENT '加密保存的项目配置方案',
  `version` INT NOT NULL DEFAULT 1 COMMENT '乐观锁版本号',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
    `created_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '创建人标识或账号',
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '修改时间',
    `updated_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '修改人标识或账号',
  PRIMARY KEY (`id`), KEY `idx_recipe_project` (`project_id`,`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目配置方案';

CREATE TABLE IF NOT EXISTS `job_async_operation` (
  `id` VARCHAR(64) NOT NULL COMMENT '后台作业标识',
  `owner_id` INT NOT NULL COMMENT '所属用户标识',
  `actor` VARCHAR(128) NOT NULL COMMENT '提交账号',
  `kind` VARCHAR(40) NOT NULL COMMENT '作业类型',
  `name` VARCHAR(200) NOT NULL COMMENT '作业显示名称',
  `request_key` VARCHAR(128) NOT NULL COMMENT '同一用户下的提交幂等键',
  `request_hash` VARCHAR(64) NOT NULL COMMENT '提交内容摘要',
  `request_payload` LONGTEXT NOT NULL COMMENT '加密保存的提交参数',
  `state` VARCHAR(20) NOT NULL DEFAULT 'QUEUED' COMMENT '作业状态：QUEUED、RUNNING、SUCCEEDED、FAILED、CANCELLED',
  `progress` INT NOT NULL DEFAULT 0 COMMENT '完成进度，0至100',
  `message` VARCHAR(1000) NOT NULL DEFAULT '' COMMENT '当前阶段或失败说明',
  `result_json` LONGTEXT NULL COMMENT '加密保存的结果摘要',
  `worker_id` VARCHAR(64) NULL COMMENT '执行节点租约标识',
  `heartbeat_at` DATETIME(6) NULL COMMENT '执行节点最近心跳时间',
  `started_at` DATETIME(6) NULL COMMENT '开始执行时间',
  `finished_at` DATETIME(6) NULL COMMENT '结束时间',
  `read_at` DATETIME(6) NULL COMMENT '完成通知阅读时间',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
    `created_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '创建人标识或账号',
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '修改时间',
    `updated_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '修改人标识或账号',
  PRIMARY KEY (`id`), UNIQUE KEY `uk_async_request` (`owner_id`,`request_key`),
  KEY `idx_async_owner` (`owner_id`,`created_at`), KEY `idx_async_state` (`state`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='后台操作与站内完成通知';

CREATE TABLE IF NOT EXISTS `job_export_record` (
  `id` VARCHAR(64) NOT NULL COMMENT '导出记录标识',
  `operation_id` VARCHAR(64) NULL COMMENT '关联后台作业标识',
  `owner_id` INT NOT NULL COMMENT '所属用户标识',
  `name` VARCHAR(200) NOT NULL COMMENT '导出文件名称',
  `scope_type` VARCHAR(24) NOT NULL COMMENT '导出范围：批次、选中模板或单份模板',
  `scope_id` VARCHAR(1000) NOT NULL COMMENT '导出对象标识摘要',
  `file_count` INT NOT NULL DEFAULT 0 COMMENT '归档内配置文件数量',
  `file_size` BIGINT NOT NULL DEFAULT 0 COMMENT '文件字节数',
  `encrypted_content` LONGTEXT NOT NULL COMMENT 'Base64编码后加密保存的导出内容',
  `download_count` INT NOT NULL DEFAULT 0 COMMENT '下载次数',
  `last_downloaded_at` DATETIME(6) NULL COMMENT '最近下载时间',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
    `created_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '创建人标识或账号',
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '修改时间',
    `updated_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '修改人标识或账号',
  PRIMARY KEY (`id`), KEY `idx_export_owner` (`owner_id`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='可追溯的配置导出记录';

CREATE TABLE IF NOT EXISTS `job_operation_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键标识',
  `owner_id` INT NULL COMMENT '操作用户标识',
  `actor` VARCHAR(128) NOT NULL COMMENT '操作账号',
  `action` VARCHAR(100) NOT NULL COMMENT '操作名称',
  `resource` VARCHAR(255) NOT NULL COMMENT '操作资源地址或对象',
  `request_method` VARCHAR(16) NOT NULL COMMENT '请求方式或后台操作类型',
  `result` VARCHAR(16) NOT NULL COMMENT '操作结果：SUCCESS或FAILED',
  `message` VARCHAR(1000) NOT NULL DEFAULT '' COMMENT '脱敏后的结果说明',
  `duration_ms` BIGINT NOT NULL DEFAULT 0 COMMENT '耗时毫秒数',
  `request_id` VARCHAR(64) NOT NULL COMMENT '请求追踪标识',
  `client_address` VARCHAR(128) NOT NULL DEFAULT '' COMMENT '客户端地址',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
    `created_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '创建人标识或账号',
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '修改时间',
    `updated_by` VARCHAR(128) NOT NULL DEFAULT 'system' COMMENT '修改人标识或账号',
  PRIMARY KEY (`id`), KEY `idx_operation_owner` (`owner_id`,`created_at`), KEY `idx_operation_resource` (`resource`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='平台操作留痕';

INSERT INTO job_group (app_name, title, `order`, address_type) SELECT 'datax-executor', 'datax执行器', 1, 0 WHERE NOT EXISTS (SELECT 1 FROM job_group WHERE app_name = 'datax-executor');
INSERT INTO job_lock (lock_name) SELECT 'schedule_lock' WHERE NOT EXISTS (SELECT 1 FROM job_lock WHERE lock_name = 'schedule_lock');
INSERT INTO job_user (username, password, role) SELECT 'admin', '$2a$10$2KCqRbra0Yn2TwvkZxtfLuWuUP5KyCWsljO/ci5pLD27pqR3TV1vy', 'ROLE_ADMIN' WHERE NOT EXISTS (SELECT 1 FROM job_user WHERE username = 'admin');
