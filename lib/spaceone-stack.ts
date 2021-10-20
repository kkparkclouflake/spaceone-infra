import * as ec2 from '@aws-cdk/aws-ec2'
import * as eks from '@aws-cdk/aws-eks'
import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam'

// let usersList = ['mzc_user04', 'mzc_user05'];

export class SpaceoneStack extends cdk.Stack {
  public readonly cluster: eks.Cluster;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // SpaceONE VPC
    const newVpc = new ec2.Vpc(this, 'spaceone-prod-vpc', {
      cidr: '10.0.0.0/16',
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 24
        },
      ]
    });

    // Master IAM Role
    const clusterAdmin = new iam.Role(this, 'AdminRole', {
      assumedBy: new iam.AccountRootPrincipal()
    });

    // provision a cluster
    const cluster = new eks.Cluster(this, 'spaceone-prod-eks-cluster', {
      clusterName: 'spaceone-prod-eks-cluster',
      version: eks.KubernetesVersion.V1_19,
      defaultCapacity: 0,
      vpc: newVpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_NAT }],
      mastersRole: clusterAdmin
    });

    // provision a Node Group
    cluster.addNodegroupCapacity('spaceone-prod-core-nodegroup', {
      nodegroupName: 'spaceone-prod-core-nodegroup',
      desiredSize: 2,
      instanceTypes: [ec2.InstanceType.of(ec2.InstanceClass.T3A, ec2.InstanceSize.MEDIUM)],
      diskSize: 20,
      labels: {"Environment": "prod", "Category": "core"},
      tags: {"Environment": "prod", "Category": "core"},
    });
    cluster.addNodegroupCapacity('spaceone-prod-supervisor-nodegroup', {
      nodegroupName: 'spaceone-prod-supervisor-nodegroup',
      desiredSize: 2,
      instanceTypes: [ec2.InstanceType.of(ec2.InstanceClass.T3A, ec2.InstanceSize.MEDIUM)],
      diskSize: 20,
      labels: {"Environment": "prod", "Category": "supervisor"},
      tags: {"Environment": "prod", "Category": "supervisor"},
    })

    // 클러스터의 aws-auth 설정
    // 현재 addMastersRole 이나 addRoleMapping 를 하면 addUserMapping 에 넣은 user 가 실제로는 들어가지 않는 문제가 있음
    // 별도로 설정이 필요한 상황은 아닌것으로 보여 일단 주석처리
    // const awsAuth = new eks.AwsAuth(this, 'clusterAuth', {
    //   cluster: cluster
    // });

    // // Apply 된 Cluster 를 업데이트 하면 기본 생성되는 Master Role 이 사라지는데 무슨 문제일까?
    // awsAuth.addMastersRole(
    //   iam.Role.fromRoleArn(this, 'mastersRoleAtAwsAuth', clusterAdmin.roleArn),
    //   clusterAdmin.roleName
    // );

    // // Cluster IAM Role
    // awsAuth.addRoleMapping(cluster.role, {
    //   groups: ["system:bootstrappers", "system:nodes"],
    //   username: "system:node:{{EC2PrivateDNSName}}"
    // });

    // for (let i = 0; usersList.length > i; i++) {
    //   awsAuth.addUserMapping(iam.User.fromUserName(this, usersList[i], usersList[i]), {
    //     username: usersList[i],
    //     groups: ["system:masters"],
    //   });
    // }
    
    this.cluster = cluster;
  }
}