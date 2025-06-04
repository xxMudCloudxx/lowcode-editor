import { type CommonComponentProps } from "../../interface";

const ContainerProd = ({ id, children, styles }: CommonComponentProps) => {
  return (
    <div style={styles} className={`p-[20px]`}>
      {children}
    </div>
  );
};

export default ContainerProd;
