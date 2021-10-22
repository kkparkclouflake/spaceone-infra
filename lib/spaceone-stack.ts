import * as ec2 from '@aws-cdk/aws-ec2'
import * as eks from '@aws-cdk/aws-eks'
import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam'

let usersList = ['mzc_user04', 'mzc_user05'];

export class SpaceoneStack extends cdk.Stack {
  public readonly cluster: eks.Cluster;
  public readonly vpc: ec2.Vpc;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // SpaceONE VPC
    // CDK 에서 Subnet IP Block 을 직접 설정하는 쉬운 방법이 없는것으로 보임 (CfnSubnet 등을 이용하여 CloudFormation 템플릿으로 처리)
    const vpc = new ec2.Vpc(this, 'spaceone-prod-vpc', {
      cidr: '10.0.0.0/16',
      maxAzs: 3,
      vpnGateway: false,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 23
        },
        {
          name: 'database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24
        }
      ]
    });
    
    this.vpc = vpc;

    // Master IAM Role
    const clusterAdmin = new iam.Role(this, 'AdminRole', {
      assumedBy: new iam.AccountRootPrincipal()
    });

    // provision a cluster
    const cluster = new eks.Cluster(this, 'spaceone-prod-eks-cluster', {
      clusterName: 'spaceone-prod-eks-cluster',
      version: eks.KubernetesVersion.V1_19,
      defaultCapacity: 0,
      vpc: vpc,
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

    // cluster.awsAuth.addMastersRole(
    //   iam.Role.fromRoleArn(this, 'mastersRoleAtAwsAuth', clusterAdmin.roleArn),
    //   clusterAdmin.roleName
    // );

    // Cluster IAM Role
    // cluster.awsAuth.addRoleMapping(cluster.role, {
    //   groups: ["system:bootstrappers", "system:nodes"],
    //   username: "system:node:{{EC2PrivateDNSName}}"
    // });

    for (let i = 0; usersList.length > i; i++) {
      cluster.awsAuth.addUserMapping(iam.User.fromUserName(this, usersList[i], usersList[i]), {
        username: usersList[i],
        groups: ["system:masters"],
      });
    }
    
    this.cluster = cluster;
  }
}