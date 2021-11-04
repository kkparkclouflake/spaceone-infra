# SpaceONE Infra

SpaceONE Infra with TypeScript CDK.

## How to use
1. `npm install -g aws-cdk`
2. `npm install`
3. `cdk diff`
4. `cdk deploy ClusterStack`
    ClusterStack 배포만 하더라도 SpaceoneStack 이 같이 배포됨 (EKS Cluster 와 SpaceONE App 이 같이 배포)
- 배포 제거
    `cdk destory ClusterStack`
    다만 현재 destory 시 EKS Controller 가 생성한 ALB 등이 같이 제거되지 않아 1시간 Timeout 대기 후 무한히 제거되지 않는 Loop 를 탈 수 있음.
    이때 수동으로 EKS와 VPC 를 지우고 다시 destroy 를 하면 정상적으로 제거됨.


## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
