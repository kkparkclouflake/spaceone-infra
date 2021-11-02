import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam'
import * as eks from '@aws-cdk/aws-eks'
import * as ec2 from '@aws-cdk/aws-ec2'

export class Eks extends cdk.Construct {
  public readonly cluster: eks.Cluster;

  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps, vpc: ec2.Vpc, admins?: string[]) {
    super(scope, id);

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

    // Add a Admin user
    if (admins) {
      for (let i = 0; admins.length > i; i++) {
        cluster.awsAuth.addUserMapping(iam.User.fromUserName(this, admins[i], admins[i]), {
          username: admins[i],
          groups: ["system:masters"],
        });
      }
    }
      

    this.cluster = cluster;
  }
}